import {
  Line, Point, Points, Text,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { createRef, useRef, useState } from 'react';
import { Vector3 } from 'three';
import PropTypes from 'prop-types';
import idFromPoints from '../utils/utils';

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

export default function ElectricalLine({ voltage, points, current }) {
  // Point color by voltage
  // Point speed by current

  const colors = [0xfcde9c, 0xfaa476, 0xf0746e, 0xe34f6f, 0xdc3977, 0xb9257a, 0x7c1d6f];
  const color = colors[clamp(Math.round(voltage), 0, colors.length - 1)];

  const directions = [];
  const segmentLengths = [];
  const threePoints = points.map((p) => new Vector3(...p));
  const lines = [];
  threePoints.slice(0, threePoints.length - 1).forEach((src, i) => {
    const dst = threePoints[i + 1];
    const diff = dst.clone().sub(src);
    segmentLengths.push(diff.length());
    directions.push(diff.normalize());
    lines.push((<Line
      points={[src, dst]}
      color="white"
      lineWidth={1}
      key={idFromPoints(src, dst)}
    />));
  });
  const lineLength = segmentLengths.reduce((x, y) => x + y);

  function vToPos(v) {
    let t = v;
    for (let i = 0; i < segmentLengths.length; i += 1) {
      if (t < segmentLengths[i]) {
        return threePoints[i].clone().add(directions[i].clone().multiplyScalar(t));
      }
      t -= segmentLengths[i];
    }
    return new Vector3();
  }

  const density = 6;
  const numPoints = Math.round(lineLength * density);
  const pointRefs = useRef([]);
  pointRefs.current = [...Array(numPoints).keys()].map((i) => pointRefs.current[i] || createRef());
  const electricPoints = [...Array(numPoints).keys()].map(
    (i) => (
      <Point position={vToPos(i / density)} key={i} ref={pointRefs.current[i]} v={i / density} />
    ),
  );

  useFrame((state, delta) => {
    electricPoints.forEach((_, i) => {
      const ref = pointRefs.current[i];
      ref.current.v = (4.0 * delta * current + ref.current.v) % lineLength;
      const p = vToPos(ref.current.v);
      ref.current.position.set(p.x, p.y, p.z);
    });
  });
  const [hovered, hover] = useState(new Vector3(10000, 0, 0));
  return (
    <group>
      <group
        onPointerMove={(ev) => { hover(ev.point); }}
        onPointerLeave={() => hover(new Vector3(10000, 0, 0))}
      >
        {lines}
      </group>
      <Points
        limit={1000} // Optional: max amount of items (for calculating buffer size)
        range={1000}
      >
        <pointsMaterial color={color} size={6} />
        {electricPoints}
      </Points>
      <Text color="white" fontSize={0.1} anchorX="left" anchorY="bottom" position={hovered}>
        {Math.round(current * 1000)}
        {' '}
        mA //
        {' '}
        {voltage.toFixed(1)}
        {' '}
        V
      </Text>
    </group>
  );
}
ElectricalLine.propTypes = {
  points: PropTypes.arrayOf(PropTypes.instanceOf(Vector3)).isRequired,
  voltage: PropTypes.number.isRequired,
  current: PropTypes.number.isRequired,
};
