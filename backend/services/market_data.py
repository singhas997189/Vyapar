"""Price & fundamentals data via yfinance (free, no API key needed).
NSE stocks use the '.NS' suffix on Yahoo Finance."""
import yfinance as yf
import pandas as pd
from functools import lru_cache
import time

_cache = {}
_CACHE_TTL = 60 * 5  # 5 minutes


def _cached(key, fn, ttl=_CACHE_TTL):
    now = time.time()
    if key in _cache:
        ts, value = _cache[key]
        if now - ts < ttl:
            return value
    value = fn()
    _cache[key] = (now, value)
    return value


def get_history(yf_symbol: str, period="1y", interval="1d") -> pd.DataFrame:
    def fetch():
        ticker = yf.Ticker(yf_symbol)
        df = ticker.history(period=period, interval=interval)
        df = df.reset_index()
        return df

    return _cached(f"hist:{yf_symbol}:{period}:{interval}", fetch)


def get_quote(yf_symbol: str) -> dict:
    def fetch():
        ticker = yf.Ticker(yf_symbol)
        info = ticker.fast_info
        hist = ticker.history(period="5d")
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else float(info.get("previousClose", 0))
        last_price = float(info.get("last_price", hist["Close"].iloc[-1] if len(hist) else 0))
        change = last_price - prev_close
        change_pct = (change / prev_close * 100) if prev_close else 0
        return {
            "price": round(last_price, 2),
            "previous_close": round(prev_close, 2),
            "change": round(change, 2),
            "change_percent": round(change_pct, 2),
            "day_high": round(float(info.get("day_high", 0)), 2),
            "day_low": round(float(info.get("day_low", 0)), 2),
            "year_high": round(float(info.get("year_high", 0)), 2),
            "year_low": round(float(info.get("year_low", 0)), 2),
            "market_cap": info.get("market_cap"),
            "volume": info.get("last_volume"),
        }

    return _cached(f"quote:{yf_symbol}", fetch, ttl=60)


def get_fundamentals(yf_symbol: str) -> dict:
    def fetch():
        ticker = yf.Ticker(yf_symbol)
        info = ticker.info
        return {
            "pe_ratio": info.get("trailingPE"),
            "pb_ratio": info.get("priceToBook"),
            "eps": info.get("trailingEps"),
            "dividend_yield": info.get("dividendYield"),
            "roe": info.get("returnOnEquity"),
            "debt_to_equity": info.get("debtToEquity"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "market_cap": info.get("marketCap"),
            "beta": info.get("beta"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "description": info.get("longBusinessSummary"),
        }

    return _cached(f"fund:{yf_symbol}", fetch, ttl=60 * 60)


def get_quotes_bulk(yf_symbols: list[str]) -> dict:
    """Fetch quotes for many symbols reasonably fast using yf.download."""
    def fetch():
        data = yf.download(
            tickers=" ".join(yf_symbols),
            period="5d",
            interval="1d",
            group_by="ticker",
            threads=True,
            progress=False,
        )
        results = {}
        for sym in yf_symbols:
            try:
                closes = data[sym]["Close"].dropna()
                if len(closes) >= 2:
                    last, prev = float(closes.iloc[-1]), float(closes.iloc[-2])
                    change_pct = (last - prev) / prev * 100 if prev else 0
                    results[sym] = {"price": round(last, 2), "change_percent": round(change_pct, 2)}
            except Exception:
                continue
        return results

    key = "bulk:" + ",".join(sorted(yf_symbols))
    return _cached(key, fetch, ttl=60 * 3)
