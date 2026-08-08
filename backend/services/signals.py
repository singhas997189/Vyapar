"""Combine technical indicators + news sentiment into one Buy/Hold/Sell signal.

Scoring is transparent and rule-based (not a black box) so the user can see
*why* a signal was generated. Score ranges from -100 (strong sell) to +100
(strong buy).
"""


def technical_score(indicators: dict) -> tuple[int, list[str]]:
    score = 0
    reasons = []

    rsi = indicators.get("rsi_14", 50)
    if rsi < 30:
        score += 25
        reasons.append(f"RSI at {rsi} indicates oversold — bullish reversal potential")
    elif rsi > 70:
        score -= 25
        reasons.append(f"RSI at {rsi} indicates overbought — pullback risk")
    else:
        reasons.append(f"RSI at {rsi} is neutral")

    if indicators.get("macd_bullish_cross"):
        score += 20
        reasons.append("MACD just crossed bullish (histogram turned positive)")
    elif indicators.get("macd_bearish_cross"):
        score -= 20
        reasons.append("MACD just crossed bearish (histogram turned negative)")
    else:
        macd_hist = indicators.get("macd_histogram", 0)
        if macd_hist > 0:
            score += 8
            reasons.append("MACD histogram positive — momentum favors buyers")
        elif macd_hist < 0:
            score -= 8
            reasons.append("MACD histogram negative — momentum favors sellers")

    price = indicators.get("current_price", 0)
    sma20 = indicators.get("sma_20")
    sma50 = indicators.get("sma_50")
    sma200 = indicators.get("sma_200")

    if sma20 and price > sma20:
        score += 8
        reasons.append("Price is above its 20-day average (short-term uptrend)")
    elif sma20 and price < sma20:
        score -= 8
        reasons.append("Price is below its 20-day average (short-term downtrend)")

    if sma50 and sma200 and sma50 > sma200:
        score += 10
        reasons.append("50-day average above 200-day average (golden-cross territory)")
    elif sma50 and sma200 and sma50 < sma200:
        score -= 10
        reasons.append("50-day average below 200-day average (death-cross territory)")

    bb_upper = indicators.get("bollinger_upper")
    bb_lower = indicators.get("bollinger_lower")
    if bb_lower and price <= bb_lower:
        score += 10
        reasons.append("Price near lower Bollinger Band — potentially undervalued short-term")
    elif bb_upper and price >= bb_upper:
        score -= 10
        reasons.append("Price near upper Bollinger Band — potentially overextended")

    return score, reasons


def sentiment_score(sentiment: dict) -> tuple[int, list[str]]:
    score = int(sentiment.get("average_score", 0) * 40)  # scale -40..+40
    reasons = []
    label = sentiment.get("label", "neutral")
    pos, neg = sentiment.get("positive", 0), sentiment.get("negative", 0)
    if label == "positive":
        reasons.append(f"News sentiment is positive ({pos} positive vs {neg} negative headlines)")
    elif label == "negative":
        reasons.append(f"News sentiment is negative ({neg} negative vs {pos} positive headlines)")
    else:
        reasons.append("News sentiment is mostly neutral")
    return score, reasons


def combined_signal(indicators: dict, sentiment: dict) -> dict:
    tech_score, tech_reasons = technical_score(indicators)
    news_score, news_reasons = sentiment_score(sentiment)

    # Weighting: technicals matter more for timing, news adds context.
    total = round(tech_score * 0.65 + news_score * 0.35)
    total = max(-100, min(100, total))

    if total >= 30:
        verdict = "BUY"
    elif total <= -30:
        verdict = "SELL"
    else:
        verdict = "HOLD"

    return {
        "verdict": verdict,
        "score": total,
        "technical_score": tech_score,
        "news_score": news_score,
        "reasons": tech_reasons + news_reasons,
    }
