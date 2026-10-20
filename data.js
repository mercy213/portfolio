// Project details and local video paths for the portfolio grid.
const PORTFOLIO_DATA = [
  {
    id: "portal2",
    title: "Portal movement & rendering",
    category: "gameplay",
    label: "Physics / Rendering",
    description: "A Portal-inspired Roblox prototype that moves characters between linked portals while preserving their direction and momentum.",
    video: "./Asessts/portal2/2026-06-30 17-46-46.mp4",
    poster: "./Asessts/posters/portal2-2026-06-30-17-46-46.jpg",
    alternateVideo: "./Asessts/portal2/2026-06-30 17-56-46.mp4",
    alternatePoster: "./Asessts/posters/portal2-2026-06-30-17-56-46.jpg"
  },
  {
    id: "crate-opening",
    title: "Crate opening",
    category: "gameplay",
    label: "Reward animation",
    description: "A crate-opening reveal built around the moment a player finds out what they got.",
    video: "./Asessts/crate opening/crate-opening.mp4",
    poster: "./Asessts/posters/crate-opening-crate-opening.jpg"
  },
  {
    id: "chassis",
    title: "Custom vehicle physics",
    category: "gameplay",
    label: "Vehicle / Physics",
    description: "A raycast-based chassis prototype with suspension, damping, steering, and tire forces tuned for arcade driving.",
    video: "./Asessts/chassis/2026-07-03 12-03-00.mp4",
    poster: "./Asessts/posters/chassis-2026-07-03-12-03-00.jpg",
    image: "./Asessts/chassis/image.png"
  },
  {
    id: "plane-system",
    title: "Flight physics",
    category: "gameplay",
    label: "Flight / Physics",
    description: "A flight controller experiment that applies lift, drag, and engine thrust from the plane’s speed and orientation.",
    video: "./Asessts/planeSystem/2026-07-03 12-18-55.mp4",
    poster: "./Asessts/posters/planesystem-2026-07-03-12-18-55.jpg"
  },
  {
    id: "npc-pathfinding",
    title: "NPC pathfinding",
    category: "gameplay",
    label: "AI / Navigation",
    description: "An NPC navigation system that builds paths around obstacles and moves characters through a world.",
    video: "./Asessts/NPCpathfinding/2026-07-03 12-31-18.mp4",
    poster: "./Asessts/posters/npcpathfinding-2026-07-03-12-31-18.jpg"
  },
  {
    id: "osu",
    title: "Rhythm game mechanics",
    category: "gameplay",
    label: "Gameplay / Timing",
    description: "A rhythm-game prototype that places hit targets against a beatmap and scores input by timing window.",
    video: "./Asessts/OSU/2026-07-03 12-26-33.mp4",
    poster: "./Asessts/posters/osu-2026-07-03-12-26-33.jpg"
  },
  {
    id: "coinflip",
    title: "Role selection · coin flip",
    category: "gameplay",
    label: "Game flow",
    description: "A coin-flip role selection moment for deciding who plays which side of a round.",
    video: "./Asessts/role selection/coinflip.mp4",
    poster: "./Asessts/posters/role-selection-coinflip.jpg"
  },
  {
    id: "matchmaking",
    title: "Matchmaking & teleporting",
    category: "systems",
    label: "Networking / Sessions",
    description: "A queue and teleport flow that groups players and moves them into a reserved game session.",
    video: "./Asessts/MatchMaking/2026-07-03 12-09-17.mp4",
    poster: "./Asessts/posters/matchmaking-2026-07-03-12-09-17.jpg"
  },
  {
    id: "car-customisation",
    title: "Vehicle customisation",
    category: "interface",
    label: "Vehicles / Customisation",
    description: "A vehicle tuning flow for changing parts and appearance, with server checks for ownership and purchase costs.",
    video: "./Asessts/CarCustomisation/2026-07-03 12-01-23.mp4",
    poster: "./Asessts/posters/carcustomisation-2026-07-03-12-01-23.jpg",
    image: "./Asessts/CarCustomisation/image.png"
  },
  {
    id: "ui-car-customisation",
    title: "Vehicle customiser UI",
    category: "interface",
    label: "Interface / Camera",
    description: "A customisation interface that pairs category panels with camera movement toward the selected part of a car.",
    video: "./Asessts/UIcarCustomisation/2026-07-03 12-29-45.mp4",
    poster: "./Asessts/posters/uicarcustomisation-2026-07-03-12-29-45.jpg"
  },
  {
    id: "combat-audio",
    title: "Combat sound effects",
    category: "interface",
    label: "Audio / Effects",
    description: "A spatial sound effect setup with randomized pitch, distance falloff, and cleanup after playback.",
    video: "./Asessts/bloxFruit Sound F/2026-07-03 11-59-30.mp4",
    poster: "./Asessts/posters/bloxfruit-sound-f-2026-07-03-11-59-30.jpg"
  },
  {
    id: "lightning-swords",
    title: "Lightning swords",
    category: "gameplay",
    label: "Combat",
    video: "./Asessts/Abilities/lightning-swords.mp4"
  },
  {
    id: "fireballs",
    title: "Fireballs",
    category: "gameplay",
    label: "Abilities",
    video: "./Asessts/Abilities/fireballs.mp4"
  },
  {
    id: "ice-class",
    title: "Ice class",
    category: "gameplay",
    label: "Class",
    video: "./Asessts/Abilities/ice-class.mp4"
  },
  {
    id: "lightning-class",
    title: "Lightning class",
    category: "gameplay",
    label: "Class",
    video: "./Asessts/Abilities/lightning-class.mp4"
  }
];
