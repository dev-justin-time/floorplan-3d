"use client";
import { jsxDEV } from "react/jsx-dev-runtime";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Text } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { convert2DTo3D, generateRoomShape } from "./3dConversionEngine.ts";
function Scene({
  floorPlanData,
  height = 2.5,
  wallThickness = 0.15,
  roomColors = {},
  roomTextures = {},
  lightIntensity = 1,
  viewMode = "3d"
}) {
  const enhancedData = convert2DTo3D(floorPlanData, {
    wallHeight: height,
    wallThickness
  });
  const { dimensions } = enhancedData;
  const maxDimension = Math.max(dimensions.width, dimensions.height);
  const cameraDistance = maxDimension * 1.5;
  return /* @__PURE__ */ jsxDEV("div", { className: "w-full h-[600px] bg-gray-100 rounded-md", children: /* @__PURE__ */ jsxDEV(
    Canvas,
    {
      shadows: true,
      camera: {
        position: viewMode === "3d" ? [cameraDistance, cameraDistance, cameraDistance] : [0, cameraDistance, 0],
        fov: 50
      },
      children: /* @__PURE__ */ jsxDEV(Suspense, { fallback: null, children: [
        /* @__PURE__ */ jsxDEV("ambientLight", { intensity: 0.3 * lightIntensity }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 54,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(
          "directionalLight",
          {
            position: [10, 10, 5],
            intensity: 0.7 * lightIntensity,
            castShadow: true
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 55,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          FloorPlan3D,
          {
            floorPlanData: enhancedData,
            height,
            wallThickness,
            roomColors,
            viewMode
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 61,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          OrbitControls,
          {
            enablePan: true,
            enableZoom: true,
            enableRotate: viewMode === "3d",
            minPolarAngle: viewMode === "3d" ? 0 : Math.PI / 2 - 0.1,
            maxPolarAngle: viewMode === "3d" ? Math.PI / 2 : Math.PI / 2 + 0.1
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 69,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(Environment, { preset: "city" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 76,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 53,
        columnNumber: 9
      }, this)
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 44,
      columnNumber: 7
    },
    this
  ) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 43,
    columnNumber: 5
  }, this);
}
function FloorPlan3D({
  floorPlanData,
  height,
  wallThickness,
  roomColors,
  viewMode
}) {
  const { rooms, walls, dimensions } = floorPlanData;
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  return /* @__PURE__ */ jsxDEV("group", { position: [-centerX, 0, -centerY], children: [
    /* @__PURE__ */ jsxDEV("mesh", { rotation: [-Math.PI / 2, 0, 0], position: [centerX, 0, centerY], receiveShadow: true, children: [
      /* @__PURE__ */ jsxDEV("planeGeometry", { args: [dimensions.width, dimensions.height] }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 108,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("meshStandardMaterial", { color: "#f0f0f0" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 109,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 107,
      columnNumber: 7
    }, this),
    rooms.map((room) => /* @__PURE__ */ jsxDEV(
      Room3D,
      {
        room,
        height,
        color: roomColors[room.id] || "#ffffff",
        viewMode
      },
      room.id,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 114,
        columnNumber: 9
      },
      this
    )),
    walls.map((wall, index) => /* @__PURE__ */ jsxDEV(
      Wall3D,
      {
        wall,
        height,
        thickness: wallThickness,
        viewMode
      },
      `wall-${index}`,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 125,
        columnNumber: 9
      },
      this
    ))
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 105,
    columnNumber: 5
  }, this);
}
function Room3D({
  room,
  height,
  color,
  viewMode
}) {
  const roomRef = useRef(null);
  const shape = useMemo(() => {
    return generateRoomShape(room.floorVertices || []);
  }, [room]);
  const geometry = useMemo(() => {
    const extrudeSettings = {
      steps: 1,
      depth: viewMode === "3d" ? height : 0.01,
      bevelEnabled: false
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [shape, height, viewMode]);
  useFrame(() => {
    if (roomRef.current) {
      roomRef.current.rotation.x = -Math.PI / 2;
    }
  });
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
  }, [color]);
  return /* @__PURE__ */ jsxDEV("group", { ref: roomRef, children: [
    /* @__PURE__ */ jsxDEV("mesh", { geometry, castShadow: true, receiveShadow: true, children: material }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 186,
      columnNumber: 7
    }, this),
    viewMode === "3d" && /* @__PURE__ */ jsxDEV("group", { position: [room.center.x, 0.1, room.center.y], children: /* @__PURE__ */ jsxDEV(
      Text,
      {
        position: [0, height + 0.1, 0],
        color: "black",
        fontSize: 0.3,
        anchorX: "center",
        anchorY: "middle",
        children: room.name
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 193,
        columnNumber: 11
      },
      this
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 192,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 185,
    columnNumber: 5
  }, this);
}
function Wall3D({
  wall,
  height,
  thickness,
  viewMode
}) {
  const length = wall.length || Math.sqrt(
    Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
  );
  const position = [
    (wall.start.x + wall.end.x) / 2,
    viewMode === "3d" ? height / 2 : 0.05,
    (wall.start.y + wall.end.y) / 2
  ];
  const angle = wall.angle || Math.atan2(
    wall.end.y - wall.start.y,
    wall.end.x - wall.start.x
  );
  const wallHeight = viewMode === "3d" ? height : 0.1;
  const wallThickness = viewMode === "3d" ? thickness : thickness * 2;
  return /* @__PURE__ */ jsxDEV("mesh", { position, rotation: [0, angle, 0], castShadow: true, receiveShadow: true, children: [
    /* @__PURE__ */ jsxDEV("boxGeometry", { args: [length, wallHeight, wallThickness] }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 243,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("meshStandardMaterial", { color: "#cccccc" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 244,
      columnNumber: 7
    }, this),
    viewMode === "3d" && wall.hasOpening && /* @__PURE__ */ jsxDEV(
      "mesh",
      {
        position: [0, -height / 2 + 1, 0],
        rotation: [0, 0, 0],
        children: [
          /* @__PURE__ */ jsxDEV("boxGeometry", { args: [0.9, 2, wallThickness * 1.1] }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 252,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("meshStandardMaterial", { color: "#ffffff" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 253,
            columnNumber: 11
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "<stdin>",
        lineNumber: 248,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 242,
    columnNumber: 5
  }, this);
}
export {
  Scene as default
};
