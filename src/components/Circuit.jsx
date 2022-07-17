import PropTypes from 'prop-types';
import React from 'react';
import { Text } from '@react-three/drei';
import { Vector3 } from 'three';
import ElectricalLine from './ElectricalLine';
import Battery from './Battery';
import Resistor from './Resistor';
import idFromPoints from '../utils/utils';

function getCircuitResistance(circuit) {
  return circuit.map((parallelResistors) => 1 / parallelResistors.map((x) => 1 / x)
    .reduce((x, y) => x + y))
    .reduce((x, y) => x + y);
}

export default function Circuit({ batteryVoltage, circuit }) {
  const circuitResistance = getCircuitResistance(circuit);
  const circuitCurrent = batteryVoltage / circuitResistance;

  // Initial fixed part of the circuit
  const circuitComponents = [];
  const battery = (<Battery negative={[-0.4, 3, 0]} positive={[0.1, 3, 0]} key="battery" />);
  circuitComponents.push(battery);
  circuitComponents.push((
    <Text color="white" fontSize={0.12} anchorX="center" anchorY="middle" position={[-0.15, 2.35, 0]} key="batteryLabel">
      {batteryVoltage}
      {' '}
      V
    </Text>));
  const startDynamic = new Vector3(2, 2.5, 0);
  const firstLine = (<ElectricalLine points={[new Vector3(0.1, 3, 0), new Vector3(2, 3, 0), startDynamic]} voltage={batteryVoltage} current={circuitCurrent} key="firstLine" />);
  circuitComponents.push(firstLine);

  let last = new Vector3(...startDynamic);
  let lastVoltage = batteryVoltage;

  // Dynamic/configurable part of the circuit
  circuit.forEach((resistors) => {
    if (resistors.length === 1) {
      const vPostResistor = lastVoltage - circuitCurrent * resistors[0];
      const resistorEnd = last.clone().add(new Vector3(0, -1.2, 0));
      const lineEnd = resistorEnd.clone().add(new Vector3(0, -0.5, 0));
      const resistor = (
        <Resistor
          src={last}
          dst={resistorEnd}
          key={idFromPoints(last, resistorEnd)}
          current={circuitCurrent}
        />
      );
      circuitComponents.push(resistor);
      const labelPosition = last.clone().add(resistorEnd).multiplyScalar(0.5)
        .add(new Vector3(0.5, 0, 0));
      circuitComponents.push((
        <Text color="white" fontSize={0.12} anchorX="center" anchorY="middle" position={labelPosition} key={idFromPoints(labelPosition)}>
          {resistors[0]}
          {' '}
          Ohm
        </Text>));
      circuitComponents.push(<ElectricalLine
        points={[resistorEnd, lineEnd]}
        voltage={vPostResistor}
        current={circuitCurrent}
        key={idFromPoints(resistorEnd, lineEnd)}
      />);
      last = lineEnd;
      lastVoltage = vPostResistor;
    } else if (resistors.length === 2) {
      const combinedResistance = getCircuitResistance([resistors]);
      const vDrop = circuitCurrent * combinedResistance;
      const vPostResistors = lastVoltage - vDrop;
      const current1 = vDrop / resistors[0];
      const current2 = vDrop / resistors[1];
      const linePreMid1 = last.clone().add(new Vector3(0.5, 0.0, 0));
      const linePreEnd1 = last.clone().add(new Vector3(0.5, -0.5, 0));
      const linePreMid2 = last.clone().add(new Vector3(-0.5, 0.0, 0));
      const linePreEnd2 = last.clone().add(new Vector3(-0.5, -0.5, 0));
      const resistorEnd1 = linePreEnd1.clone().add(new Vector3(0, -1.2, 0));
      const resistorEnd2 = linePreEnd2.clone().add(new Vector3(0, -1.2, 0));
      const linePostMid1 = resistorEnd1.clone().add(new Vector3(0, -0.5, 0));
      const linePostMid2 = resistorEnd2.clone().add(new Vector3(0, -0.5, 0));
      const postResistorJunction = new Vector3(last.x, linePostMid1.y, last.z);
      const lineFinish = new Vector3(last.x, linePostMid1.y - 0.5, last.z);
      circuitComponents.push(<ElectricalLine
        points={[last, linePreMid1, linePreEnd1]}
        voltage={lastVoltage}
        current={current1}
        key={idFromPoints(last, linePostMid1, linePreEnd1)}
      />);
      circuitComponents.push(<ElectricalLine
        points={[last, linePreMid2, linePreEnd2]}
        voltage={lastVoltage}
        current={current2}
        key={idFromPoints(last, linePreMid2, linePreEnd2)}
      />);
      circuitComponents.push(<Resistor
        src={linePreEnd1}
        dst={resistorEnd1}
        key={idFromPoints(resistorEnd1)}
        current={current1}
      />);
      circuitComponents.push(<Resistor
        src={linePreEnd2}
        dst={resistorEnd2}
        key={idFromPoints(resistorEnd2)}
        current={current2}
      />);

      const labelPosition1 = linePreEnd1.clone().add(resistorEnd1).multiplyScalar(0.5)
        .add(new Vector3(0.45, 0, 0));
      circuitComponents.push((
        <Text color="white" fontSize={0.1} anchorX="center" anchorY="middle" position={labelPosition1} key={idFromPoints(labelPosition1)}>
          {resistors[0]}
          {' '}
          Ohm
        </Text>));
      const labelPosition2 = linePreEnd2.clone().add(resistorEnd2).multiplyScalar(0.5)
        .add(new Vector3(0.45, 0, 0));
      circuitComponents.push((
        <Text color="white" fontSize={0.1} anchorX="center" anchorY="middle" position={labelPosition2} key={idFromPoints(labelPosition2)}>
          {resistors[1]}
          {' '}
          Ohm
        </Text>));

      circuitComponents.push(<ElectricalLine
        points={[resistorEnd1, linePostMid1, postResistorJunction]}
        voltage={vPostResistors}
        current={current1}
        key={idFromPoints(resistorEnd1, linePostMid1, postResistorJunction)}
      />);
      circuitComponents.push(<ElectricalLine
        points={[resistorEnd2, linePostMid2, postResistorJunction]}
        voltage={vPostResistors}
        current={current2}
        key={idFromPoints(resistorEnd2, linePostMid2, postResistorJunction)}
      />);
      circuitComponents.push(<ElectricalLine
        points={[postResistorJunction, lineFinish]}
        voltage={vPostResistors}
        current={circuitCurrent}
        key={idFromPoints(postResistorJunction, lineFinish)}
      />);
      last = lineFinish;
      lastVoltage = vPostResistors;
    }
  });

  // Last fixed part of the circuit
  circuitComponents.push(<ElectricalLine
    points={[last, new Vector3(-2, last.y, 0), new Vector3(-2, 3, 0), new Vector3(-0.4, 3, 0)]}
    voltage={lastVoltage}
    current={circuitCurrent}
    key="lastLine"
  />);

  return (<group>{circuitComponents}</group>);
}
Circuit.propTypes = {
  circuit: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  batteryVoltage: PropTypes.number.isRequired,
};
