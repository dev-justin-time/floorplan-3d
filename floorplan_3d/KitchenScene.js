import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import Cabinet from './Cabinet.js';
import Wall from './Wall.js';

export default function KitchenScene({ cabinets, selectedCabinet, onSelectCabinet, showLabels, onControlsRef, room }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(8, 6, 12);
    camera.lookAt(0, 2, 0);
  }, [camera]);

  const rw = Math.max(4, room?.width ?? 20);
  const rd = Math.max(4, room?.depth ?? 12);
  const rh = Math.max(4, room?.height ?? 6);

  const lights = [
    React.createElement('ambientLight', { intensity: 0.4, key: 'al' }),
    React.createElement('directionalLight', { position: [10, 10, 5], intensity: 1, castShadow: true, key: 'dl1' }),
    React.createElement('directionalLight', { position: [-10, 10, -5], intensity: 0.5, key: 'dl2' })
  ];

  const floor = React.createElement(Box, { args: [rw, 0.1, rd], position: [0, -0.05, 0], castShadow: true, receiveShadow: true, key: 'floor' },
    React.createElement('meshStandardMaterial', { color: '#f5f5f5', roughness: 0.9 })
  );

  const walls = [
    React.createElement(Wall, { position: [-rw/2, rh/2, 0], size: [0.2, rh, rd], name: 'Left Wall', showLabels, key: 'lw' }),
    React.createElement(Wall, { position: [rw/2, rh/2, 0], size: [0.2, rh, rd], name: 'Right Wall', showLabels, key: 'rw' }),
    React.createElement(Wall, { position: [0, rh/2, -rd/2], size: [rw, rh, 0.2], name: 'Back Wall', showLabels, key: 'bw' })
  ];

  const cabChildren = cabinets.map((cabinet) =>
    React.createElement(Cabinet, {
      key: cabinet.id,
      position: cabinet.position,
      size: cabinet.size,
      color: cabinet.color,
      name: cabinet.name,
      isSelected: selectedCabinet === cabinet.id,
      onClick: () => onSelectCabinet(cabinet.id),
      showLabels
    })
  );

  const controls = React.createElement(OrbitControls, { ref: onControlsRef, enablePan: true, enableZoom: true, enableRotate: true, minDistance: 5, maxDistance: 20 });

  return React.createElement(React.Fragment, null, ...lights, floor, ...walls, ...cabChildren, controls);
}