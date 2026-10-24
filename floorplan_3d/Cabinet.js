import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';

export default function Cabinet({ position, size, color, name, isSelected, onClick, showLabels }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (isSelected && meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const children = [
    React.createElement(Box, { ref: meshRef, args: size, castShadow: true, receiveShadow: true }, 
      React.createElement('meshStandardMaterial', { color, roughness: 0.3, metalness: 0.1 })
    )
  ];

  if (showLabels) {
    children.push(
      React.createElement(Text, {
        position: [0, size[1] / 2 + 0.1, 0],
        fontSize: 0.3,
        color: 'black',
        anchorX: 'center',
        anchorY: 'middle'
      }, name)
    );
  }

  return React.createElement('group', { position, onClick }, children);
}

