"""Compute technical indicators from OHLC price history using pure pandas
(no TA-Lib dependency, so it installs cleanly everywhere)."""
import pandas as pd
import numpy as np


def compute_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)


def compute_macd(close: pd.Series, fast=12, slow=26, signal=9):
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def compute_sma(close: pd.Series, period: int) -> pd.Series:
    return close.rolling(window=period, min_periods=1).mean()


def compute_bollinger(close: pd.Series, period=20, std_mult=2):
    sma = compute_sma(close, period)
    std = close.rolling(window=period, min_periods=1).std()
    upper = sma + std_mult * std
    lower = sma - std_mult * std
    return upper, sma, lower


def build_indicator_snapshot(df: pd.DataFrame) -> dict:
    """df must have a 'Close' column, sorted by date ascending."""
    close = df["Close"]

    rsi = compute_rsi(close)
    macd_line, signal_line, hist = compute_macd(close)
    sma20 = compute_sma(close, 20)
    sma50 = compute_sma(close, 50)
    sma200 = compute_sma(close, 200)
    bb_upper, bb_mid, bb_lower = compute_bollinger(close)

    last = -1
    current_price = float(close.iloc[last])

    return {
        "current_price": round(current_price, 2),
        "rsi_14": round(float(rsi.iloc[last]), 2),
        "macd": round(float(macd_line.iloc[last]), 3),
        "macd_signal": round(float(signal_line.iloc[last]), 3),
        "macd_histogram": round(float(hist.iloc[last]), 3),
        "sma_20": round(float(sma20.iloc[last]), 2),
        "sma_50": round(float(sma50.iloc[last]), 2) if not np.isnan(sma50.iloc[last]) else None,
        "sma_200": round(float(sma200.iloc[last]), 2) if not np.isnan(sma200.iloc[last]) else None,
        "bollinger_upper": round(float(bb_upper.iloc[last]), 2),
        "bollinger_lower": round(float(bb_lower.iloc[last]), 2),
        "macd_bullish_cross": bool(
            len(hist) > 1 and hist.iloc[-2] < 0 and hist.iloc[-1] > 0
        ),
        "macd_bearish_cross": bool(
            len(hist) > 1 and hist.iloc[-2] > 0 and hist.iloc[-1] < 0
        ),
    }
