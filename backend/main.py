import json
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import init_db, get_db, Holding
from services import market_data, indicators as ind, news as news_service, signals as signal_service

app = FastAPI(title="Nifty 500 Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

DATA_DIR = Path(__file__).parent / "data"
STOCKS = json.loads((DATA_DIR / "nifty500.json").read_text())
STOCKS_BY_SYMBOL = {s["symbol"]: s for s in STOCKS}


# ---------------------------------------------------------------- stocks --
@app.get("/api/stocks")
def list_stocks(sector: str | None = None, search: str | None = None):
    results = STOCKS
    if sector:
        results = [s for s in results if s["sector"].lower() == sector.lower()]
    if search:
        q = search.lower()
        results = [s for s in results if q in s["name"].lower() or q in s["symbol"].lower()]
    return {"count": len(results), "stocks": results}


@app.get("/api/sectors")
def list_sectors():
    sectors: dict[str, int] = {}
    for s in STOCKS:
        sectors[s["sector"]] = sectors.get(s["sector"], 0) + 1
    return [{"sector": k, "stock_count": v} for k, v in sorted(sectors.items())]


@app.get("/api/stock/{symbol}")
def get_stock(symbol: str):
    symbol = symbol.upper()
    meta = STOCKS_BY_SYMBOL.get(symbol)
    if not meta:
        raise HTTPException(404, f"{symbol} not found in Nifty 500 list")

    yf_symbol = meta["yf_symbol"]
    try:
        quote = market_data.get_quote(yf_symbol)
        hist = market_data.get_history(yf_symbol, period="1y")
        chart = [
            {"date": row["Date"].strftime("%Y-%m-%d"), "close": round(float(row["Close"]), 2)}
            for _, row in hist.iterrows()
        ]
    except Exception as e:
        raise HTTPException(502, f"Could not fetch market data: {e}")

    return {**meta, "quote": quote, "chart": chart}


@app.get("/api/stock/{symbol}/fundamentals")
def get_fundamentals(symbol: str):
    symbol = symbol.upper()
    meta = STOCKS_BY_SYMBOL.get(symbol)
    if not meta:
        raise HTTPException(404, f"{symbol} not found")
    try:
        return market_data.get_fundamentals(meta["yf_symbol"])
    except Exception as e:
        raise HTTPException(502, f"Could not fetch fundamentals: {e}")


@app.get("/api/stock/{symbol}/indicators")
def get_indicators(symbol: str):
    symbol = symbol.upper()
    meta = STOCKS_BY_SYMBOL.get(symbol)
    if not meta:
        raise HTTPException(404, f"{symbol} not found")
    try:
        hist = market_data.get_history(meta["yf_symbol"], period="1y")
        return ind.build_indicator_snapshot(hist)
    except Exception as e:
        raise HTTPException(502, f"Could not compute indicators: {e}")


@app.get("/api/stock/{symbol}/news")
def get_news(symbol: str):
    symbol = symbol.upper()
    meta = STOCKS_BY_SYMBOL.get(symbol)
    if not meta:
        raise HTTPException(404, f"{symbol} not found")
    try:
        articles = news_service.fetch_news(meta["name"], symbol)
        agg = news_service.aggregate_sentiment(articles)
        return {"articles": articles, "sentiment_summary": agg}
    except Exception as e:
        raise HTTPException(502, f"Could not fetch news: {e}")


@app.get("/api/stock/{symbol}/signal")
def get_signal(symbol: str):
    symbol = symbol.upper()
    meta = STOCKS_BY_SYMBOL.get(symbol)
    if not meta:
        raise HTTPException(404, f"{symbol} not found")
    try:
        hist = market_data.get_history(meta["yf_symbol"], period="1y")
        indicators = ind.build_indicator_snapshot(hist)
        articles = news_service.fetch_news(meta["name"], symbol)
        sentiment = news_service.aggregate_sentiment(articles)
        signal = signal_service.combined_signal(indicators, sentiment)
        return {"symbol": symbol, "indicators": indicators, "sentiment": sentiment, "signal": signal}
    except Exception as e:
        raise HTTPException(502, f"Could not compute signal: {e}")


@app.get("/api/sector/{sector_name}/overview")
def sector_overview(sector_name: str):
    stocks = [s for s in STOCKS if s["sector"].lower() == sector_name.lower()]
    if not stocks:
        raise HTTPException(404, "Sector not found")
    yf_symbols = [s["yf_symbol"] for s in stocks[:40]]  # cap to keep it fast
    try:
        quotes = market_data.get_quotes_bulk(yf_symbols)
    except Exception as e:
        raise HTTPException(502, f"Could not fetch sector data: {e}")

    enriched = []
    for s in stocks:
        q = quotes.get(s["yf_symbol"])
        if q:
            enriched.append({**s, **q})
    return {"sector": sector_name, "stocks": enriched}


# -------------------------------------------------------------- portfolio --
class HoldingIn(BaseModel):
    symbol: str
    quantity: float
    buy_price: float
    buy_date: datetime | None = None
    notes: str | None = None


@app.get("/api/portfolio")
def get_portfolio(db: Session = Depends(get_db)):
    holdings = db.query(Holding).all()
    result = []
    total_invested = 0.0
    total_current = 0.0

    for h in holdings:
        meta = STOCKS_BY_SYMBOL.get(h.symbol.upper())
        current_price = h.buy_price
        if meta:
            try:
                current_price = market_data.get_quote(meta["yf_symbol"])["price"]
            except Exception:
                pass

        invested = h.quantity * h.buy_price
        current_value = h.quantity * current_price
        pnl = current_value - invested
        pnl_pct = (pnl / invested * 100) if invested else 0

        total_invested += invested
        total_current += current_value

        result.append(
            {
                "id": h.id,
                "symbol": h.symbol,
                "name": meta["name"] if meta else h.symbol,
                "quantity": h.quantity,
                "buy_price": h.buy_price,
                "current_price": current_price,
                "invested_value": round(invested, 2),
                "current_value": round(current_value, 2),
                "pnl": round(pnl, 2),
                "pnl_percent": round(pnl_pct, 2),
                "buy_date": h.buy_date,
                "notes": h.notes,
            }
        )

    total_pnl = total_current - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested else 0

    return {
        "holdings": result,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_percent": round(total_pnl_pct, 2),
        },
    }


@app.post("/api/portfolio")
def add_holding(payload: HoldingIn, db: Session = Depends(get_db)):
    symbol = payload.symbol.upper()
    if symbol not in STOCKS_BY_SYMBOL:
        raise HTTPException(400, f"{symbol} is not a recognized Nifty 500 symbol")
    holding = Holding(
        symbol=symbol,
        name=STOCKS_BY_SYMBOL[symbol]["name"],
        quantity=payload.quantity,
        buy_price=payload.buy_price,
        buy_date=payload.buy_date or datetime.utcnow(),
        notes=payload.notes,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return {"id": holding.id, "message": "Holding added"}


@app.put("/api/portfolio/{holding_id}")
def update_holding(holding_id: int, payload: HoldingIn, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(404, "Holding not found")
    holding.quantity = payload.quantity
    holding.buy_price = payload.buy_price
    if payload.buy_date:
        holding.buy_date = payload.buy_date
    holding.notes = payload.notes
    db.commit()
    return {"message": "Holding updated"}


@app.delete("/api/portfolio/{holding_id}")
def delete_holding(holding_id: int, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(404, "Holding not found")
    db.delete(holding)
    db.commit()
    return {"message": "Holding deleted"}


@app.get("/")
def root():
    return {"status": "ok", "message": "Nifty 500 Analyzer API is running"}
