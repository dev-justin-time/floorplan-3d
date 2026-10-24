import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Save, FileText } from 'lucide-react';
import KitchenScene from './KitchenScene.js';
import Cutlist from './Cutlist.js';
import ControlPanel from './ControlPanel.js';
import ViewControls from './ViewControls.js';

export default function App() {
  const [cabinets, setCabinets] = useState([
    { id: 1, name: 'Base Cabinet 1', position: [-6, 1.75, -2], size: [2, 3.5, 2], color: '#8B4513', material: 'Hardwood' },
    { id: 2, name: 'Base Cabinet 2', position: [-4, 1.75, -2], size: [2, 3.5, 2], color: '#8B4513', material: 'Hardwood' },
    { id: 3, name: 'Wall Cabinet 1', position: [-5, 5, -2], size: [4, 2, 1.5], color: '#A0522D', material: 'Plywood' },
    { id: 4, name: 'Base Cabinet 3', position: [2, 1.75, -2], size: [3, 3.5, 2], color: '#8B4513', material: 'Hardwood' },
    { id: 5, name: 'Wall Cabinet 2', position: [3.5, 5, -2], size: [2, 2, 1.5], color: '#A0522D', material: 'Plywood' }
  ]);
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, depth: 0 });
  const controlsRef = useRef(null);

  const [project, setProject] = useState({
    clientName: 'New Client',
    jobName: 'Kitchen Project',
    room: { width: 20, depth: 12, height: 6 }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kitchen_design_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.cabinets)) setCabinets(parsed.cabinets);
        if (typeof parsed.showLabels === 'boolean') setShowLabels(parsed.showLabels);
        if (parsed.project && parsed.project.room) setProject(parsed.project);
      }
    } catch (error) {
      console.error('Error loading saved design:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedCabinet) {
      const cabinet = cabinets.find(c => c.id === selectedCabinet);
      if (cabinet) {
        setDimensions({ width: cabinet.size[0], height: cabinet.size[1], depth: cabinet.size[2] });
      }
    }
  }, [selectedCabinet, cabinets]);

  const addCabinet = () => {
    const newId = Math.max(...cabinets.map(c => c.id), 0) + 1;
    const newCabinet = {
      id: newId,
      name: `Cabinet ${newId}`,
      position: [0, 1.75, -2],
      size: [2, 3.5, 2],
      color: '#8B4513',
      material: 'Hardwood'
    };
    setCabinets([...cabinets, newCabinet]);
    setSelectedCabinet(newId);
  };

  const removeCabinet = () => {
    if (selectedCabinet) {
      setCabinets(cabinets.filter(c => c.id !== selectedCabinet));
      setSelectedCabinet(null);
    }
  };

  const updateCabinet = (property, value) => {
    if (selectedCabinet) {
      setCabinets(cabinets.map(cabinet =>
        cabinet.id === selectedCabinet ? { ...cabinet, [property]: value } : cabinet
      ));
    }
  };

  const resetView = () => {
    setSelectedCabinet(null);
    setDimensions({ width: 0, height: 0, depth: 0 });
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const saveDesign = () => {
    const payload = { version: 1, timestamp: new Date().toISOString(), cabinets, showLabels, project };
    try {
      localStorage.setItem('kitchen_design_v1', JSON.stringify(payload));
    } catch (error) {
      console.error('Error saving design:', error);
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kitchen_design.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef(null);
  const loadDesign = () => { fileInputRef.current?.click(); };

  const onDesignFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data.cabinets)) setCabinets(data.cabinets);
        if (typeof data.showLabels === 'boolean') setShowLabels(data.showLabels);
        if (data.project && data.project.room) setProject(data.project);
        setSelectedCabinet(null);
        setDimensions({ width: 0, height: 0, depth: 0 });
        if (controlsRef.current) controlsRef.current.reset();
      } catch (error) {
        console.error('Error loading design file:', error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const headerLeft = React.createElement('div', { className: 'flex items-center gap-3' }, [
    React.createElement('div', { className: 'w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center', key: 'logo' },
      React.createElement('svg', { className: 'w-6 h-6 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
      )
    ),
    React.createElement('div', { key: 'titles' }, [
      React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' }, 'Kitchen Cabinet Designer'),
      React.createElement('p', { className: 'text-sm text-gray-600' }, '3D Design Platform with NKBA Guidelines')
    ])
  ]);

  const headerRight = React.createElement('div', { className: 'flex items-center gap-3' }, [
    React.createElement('button', {
      onClick: loadDesign,
      className: 'flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
    }, [React.createElement(FileText, { className: 'w-4 h-4', key: 'icon' }), 'Load Design']),
    React.createElement('button', {
      onClick: saveDesign,
      className: 'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
    }, [React.createElement(Save, { className: 'w-4 h-4', key: 'icon' }), 'Save Design']),
    React.createElement('input', { ref: fileInputRef, type: 'file', accept: 'application/json', onChange: onDesignFile, className: 'hidden' })
  ]);

  const header = React.createElement('header', { className: 'bg-white shadow-sm border-b border-gray-200 px-6 py-4' },
    React.createElement('div', { className: 'flex items-center justify-between' }, [headerLeft, headerRight])
  );

  const canvas = React.createElement(Canvas, { shadows: true, camera: { position: [8, 6, 12], fov: 60 } },
    React.createElement(KitchenScene, {
      cabinets,
      selectedCabinet,
      onSelectCabinet: setSelectedCabinet,
      showLabels,
      onControlsRef: controlsRef,
      room: project.room
    })
  );

  const viewControls = React.createElement(ViewControls, { showLabels, setShowLabels, resetView });

  const leftPane = React.createElement('div', { className: 'flex-1 bg-gray-100 relative' }, [canvas, viewControls]);

  const rightPane = React.createElement('div', { className: 'w-96 bg-white border-l border-gray-200 flex flex-col' },
    React.createElement(React.Fragment, null,
      React.createElement(ControlPanel, {
        project, setProject,
        selectedCabinet,
        cabinets,
        addCabinet, removeCabinet,
        dimensions, setDimensions,
        updateCabinet
      }),
      React.createElement(Cutlist, { cabinets })
    )
  );

  const main = React.createElement('div', { className: 'flex flex-1 overflow-hidden' }, [leftPane, rightPane]);

  return React.createElement('div', { className: 'h-full bg-gray-50 flex flex-col' }, [header, main]);
}