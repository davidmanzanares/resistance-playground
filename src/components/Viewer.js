import * as React from 'react'
import { Canvas } from '@react-three/fiber'
import { MapControls, OrthographicCamera } from '@react-three/drei'
import { useState } from 'react'
import Circuit from './Circuit';


export default function Viewer() {
  const [circuitValue, changeCircuit] = useState([
    [15],
    [30, 100],
    [5],
  ]);
  const [batteryVoltageValue, changeBatteryVoltage] = useState(7);

  function circuitChange(ev){
    const textarea = ev.target.value;
    const lines = textarea.split('\n');
    const circuit = lines.map(line => line.split(' ').map(parseFloat)).filter(resistors => resistors.every(r => !isNaN(r)));
    console.log(circuit)
    changeCircuit(circuit);
  }
  return (
    <div className="Viewer">
    <div className="panel">
      <h2>Circuit Configuration</h2>
      <h3>Battery</h3>
      <label>Voltage:</label>
      <input type="number" defaultValue="7" min="0" onChange={ev => changeBatteryVoltage(parseFloat(ev.target.value))}></input>
      <h3>Resistors</h3>
      <textarea defaultValue="15&#13;&#10;30 100&#13;&#10;5" rows="6" onChange={ev => circuitChange(ev)}>
      </textarea>
    </div>
    <Canvas>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={120} />
      <MapControls target={[0,0,0]} screenSpacePanning={true} enableRotate={false}/>
      <Circuit circuit={circuitValue} batteryVoltage={batteryVoltageValue}></Circuit>
    </Canvas>
    </div>
  )
}