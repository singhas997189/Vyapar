import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function PriceChart({ data, positive }) {
  const color = positive ? '#2FBF71' : '#E5484D'

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#232C38" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#8A96A6', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          tickFormatter={(d) => d.slice(5)}
          minTickGap={40}
          axisLine={{ stroke: '#232C38' }}
          tickLine={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: '#8A96A6', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          contentStyle={{ background: '#161D26', border: '1px solid #232C38', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8A96A6' }}
          itemStyle={{ color: '#E8EDF3', fontFamily: 'JetBrains Mono' }}
          formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Close']}
        />
        <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill="url(#priceFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
