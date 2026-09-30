import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import type { ChartPoint } from '../../models/services/marketApi';
import { colors } from './ui';

const HEIGHT = 200;
const PAD = 8;

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n < 10 ? 4 : 2 });

/** Interactive line chart: touch or drag to inspect the price at any point. */
export function PriceChart({
  points,
  color,
  onSelect,
}: {
  points: ChartPoint[];
  color: string;
  /** Called with the inspected point while dragging, and with undefined on release. */
  onSelect?: (point?: ChartPoint) => void;
}) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState<number>();

  const { min, max } = useMemo(() => {
    const prices = points.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [points]);

  const x = (i: number) => PAD + (i / Math.max(points.length - 1, 1)) * Math.max(width - PAD * 2, 1);
  const y = (price: number) => PAD + (1 - (price - min) / Math.max(max - min, 1e-9)) * (HEIGHT - PAD * 2);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${HEIGHT} L${x(0).toFixed(1)},${HEIGHT} Z`;

  const inspect = (locationX: number) => {
    if (width <= PAD * 2 || points.length === 0) return;
    const ratio = Math.min(Math.max((locationX - PAD) / (width - PAD * 2), 0), 1);
    const i = Math.round(ratio * (points.length - 1));
    setIndex(i);
    onSelect?.(points[i]);
  };

  const release = () => {
    setIndex(undefined);
    onSelect?.(undefined);
  };

  const selected = index !== undefined ? points[index] : undefined;
  const gradientId = `fill-${color.replace('#', '')}`;

  return (
    <View style={s.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => inspect(e.nativeEvent.locationX)}
      onResponderMove={(e) => inspect(e.nativeEvent.locationX)}
      onResponderRelease={release}
      onResponderTerminate={release}
    >
      {width > 0 && points.length > 1 ? (
        <Svg width={width} height={HEIGHT} pointerEvents="none">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.35} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${gradientId})`} />
          <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {selected ? (
            <>
              <Line x1={x(index!)} x2={x(index!)} y1={0} y2={HEIGHT} stroke={colors.muted} strokeWidth={1} strokeDasharray="4 4" />
              <Circle cx={x(index!)} cy={y(selected.price)} r={5} fill={color} stroke="#fff" strokeWidth={2} />
            </>
          ) : null}
        </Svg>
      ) : null}
      {selected ? (
        <View style={[s.tip, { left: Math.min(Math.max(x(index!) - 60, 0), Math.max(width - 120, 0)) }]} pointerEvents="none">
          <Text style={s.tipPrice}>{usd(selected.price)}</Text>
          <Text style={s.tipTime}>{new Date(selected.time).toLocaleString()}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: HEIGHT, width: '100%', position: 'relative' },
  tip: {
    position: 'absolute',
    top: 0,
    width: 120,
    backgroundColor: colors.cardHighlight,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  tipPrice: { color: colors.text, fontWeight: '700', fontSize: 13 },
  tipTime: { color: colors.muted, fontSize: 10 },
});
