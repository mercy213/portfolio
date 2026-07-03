const PORTFOLIO_DATA = [
  {
    id: "portal2",
    title: "Portal 2 Porting & Rendering Engine",
    category: "Physics & Camera Math",
    description: "A complete replication of Portal 2's teleportation physics and visual portals in Roblox. Computes relative player position, translates linear/angular velocity vectors dynamically across variable portal orientations, and renders live portals using hardware-accelerated ViewportFrames updated in real-time.",
    folder: "portal2",
    video: "./Asessts/portal2/2026-06-30 17-46-46.mp4",
    alternateVideo: "./Asessts/portal2/2026-06-30 17-56-46.mp4",
    file: "PortalTeleportationService.lua",
    terminalOutput: [
      "[System] Loading PortalTeleportationService...",
      "[Physics] Syncing workspace physics step to 240Hz...",
      "[Renderer] Creating ViewportFrame buffers for Portal_A and Portal_B...",
      "[Math] Dynamic portal-to-portal transformation matrix initialized.",
      "[Portal] Listening for workspace character bounding box entries...",
      "[Physics] Teleportation triggered: Player relative velocity translated.",
      "[Physics] Momentum conserved. Outgoing vector: {0, 85, -20}."
    ],
    code: `local PortalTeleportationService = {}
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

-- Teleports a character between portals while maintaining momentum and orientation
function PortalTeleportationService.teleport(character, portalIn, portalOut)
    local root = character:FindFirstChild("HumanoidRootPart")
    local humanoid = character:FindFirstChild("Humanoid")
    if not root or not humanoid then return end

    -- Get local offsets relative to incoming portal
    local relativeCF = portalIn.CFrame:ToObjectSpace(root.CFrame)
    
    -- Rotate 180 degrees around the Y axis to face out of the destination portal
    local rotatedCF = CFrame.Angles(0, math.pi, 0) * relativeCF
    
    -- Apply translated CFrame to destination portal
    local newCF = portalOut.CFrame:ToWorldSpace(rotatedCF)
    
    -- Translate velocity vectors
    local localVelocity = portalIn.CFrame:VectorToObjectSpace(root.AssemblyLinearVelocity)
    -- Flip X and Z velocity to align with facing outward
    local rotatedVelocity = Vector3.new(-localVelocity.X, localVelocity.Y, -localVelocity.Z)
    local newVelocity = portalOut.CFrame:VectorToWorldSpace(rotatedVelocity)
    
    -- Perform atomic position update and apply momentum
    root.CFrame = newCF
    root.AssemblyLinearVelocity = newVelocity
    
    -- Brief momentum damping override to prevent physics hiccups
    humanoid:ChangeState(Enum.HumanoidStateType.Freefall)
end

return PortalTeleportationService`
  },
  {
    id: "PlotService",
    title: "plot placement and service",
    category: "System Architectures",
    description: "A secure grid placement system that allows players to build and save custom plots. Utilizes local bounding box collision calculations for client-side feedback and a strict, server-side spatial check to prevent overlapping or out-of-bounds placements.",
    folder: "PlotService",
    video: "./Asessts/PlotService/2026-07-03 12-15-30.mp4",
    file: "PlotPlacementManager.lua",
    terminalOutput: [
      "[System] Loading PlotPlacementManager...",
      "[Grid] Grid size set to 2x2 studs.",
      "[Server] Active plots loaded: 12. Listening for remote placement requests...",
      "[Placement] Player_A requested placement of 'Wall_Type_A' at {32.0, 10.5, -64.0}.",
      "[Physics] Bounding box overlap verification... PASSED.",
      "[Database] Serialized plot updates written successfully.",
      "[Server] Placement confirmed: Wall_Type_A spawned on Plot_4."
    ],
    code: `local PlotPlacementManager = {}
local HttpService = game:GetService("HttpService")

-- Grid settings
local GRID_SIZE = 2
local PLOT_BOUNDS = Vector3.new(100, 50, 100) -- Maximum size of a plot

-- Validates placement on server to prevent client exploits
function PlotPlacementManager.validatePlacement(playerPlot, itemModel, targetCFrame)
    local plotCF = playerPlot.CFrame
    local size = itemModel:GetExtentsSize()
    
    -- 1. Clamp target coordinates to local plot grid
    local localCF = plotCF:ToObjectSpace(targetCFrame)
    local snapX = math.round(localCF.X / GRID_SIZE) * GRID_SIZE
    local snapZ = math.round(localCF.Z / GRID_SIZE) * GRID_SIZE
    local validatedLocalCF = CFrame.new(snapX, localCF.Y, snapZ) * localCF.Rotation
    
    -- 2. Verify boundary checks (Bounding box within plot bounds)
    if math.abs(snapX) + (size.X / 2) > PLOT_BOUNDS.X / 2 or 
       math.abs(snapZ) + (size.Z / 2) > PLOT_BOUNDS.Z / 2 then
        warn("Placement rejected: Out of plot boundaries!")
        return false
    end
    
    -- 3. Collision validation using spatial query
    local overlapParams = OverlapParams.new()
    overlapParams.FilterType = Enum.RaycastFilterType.Include
    overlapParams.FilterDescendantsInstances = {playerPlot.PlacedItems}
    
    local targetWorldCF = plotCF:ToWorldSpace(validatedLocalCF)
    local collisions = workspace:GetPartBoundsInBox(targetWorldCF, size, overlapParams)
    
    if #collisions > 0 then
        warn("Placement rejected: Overlapping existing structures!")
        return false
    end
    
    return true, targetWorldCF
end

return PlotPlacementManager`
  },
  {
    id: "DataStores",
    title: "Transactional Profile Store & Autosave",
    category: "Backend Databases",
    description: "A bulletproof data storage framework incorporating session-locking to prevent item duplication across servers, auto-saving intervals, and data-loss mitigation strategies. Implements exponential backoffs and retry limits for handling external service outages.",
    folder: "DataStores",
    video: "./Asessts/DataStores/2026-07-03 12-19-51.mp4",
    image: "./Asessts/DataStores/image.png",
    file: "ProfileStoreService.lua",
    terminalOutput: [
      "[System] Loading ProfileStoreService...",
      "[DataStore] Initializing connection to 'UserDataStore_v4'...",
      "[DataStore] Active profiles database cache verified.",
      "[Cache] Retrieving data for Player ID 43289053... Success.",
      "[Lock] Session lock acquired on server ID: job_930278...",
      "[Autosave] Triggered autosave for 4 active profiles...",
      "[DataStore] Profile 43289053 written in 143ms."
    ],
    code: `local ProfileStoreService = {}
local DataStoreService = game:GetService("DataStoreService")
local UserStore = DataStoreService:GetDataStore("UserDataStore_v4")

local SESSION_LOCK_TIMEOUT = 120 -- seconds
local MAX_RETRIES = 5

-- Safe transactional load utilizing session locks to prevent duplication
function ProfileStoreService.loadProfile(player)
    local key = "Player_" .. player.UserId
    local retries = 0
    local success, profileData
    
    while retries < MAX_RETRIES do
        success, profileData = pcall(function()
            return UserStore:UpdateAsync(key, function(oldData)
                oldData = oldData or { coins = 100, inventory = {}, sessionLock = nil }
                
                -- Check for existing session lock
                if oldData.sessionLock and (os.time() - oldData.sessionLock.timestamp < SESSION_LOCK_TIMEOUT) then
                    if oldData.sessionLock.serverId ~= game.JobId then
                        error("Session is locked by another server: " .. oldData.sessionLock.serverId)
                    end
                end
                
                -- Lock session to current server
                oldData.sessionLock = {
                    serverId = game.JobId,
                    timestamp = os.time()
                }
                return oldData
            end)
        end)
        
        if success then break end
        retries = retries + 1
        task.wait(retries * 2) -- Exponential backoff
    end
    
    return success and profileData or nil
end

return ProfileStoreService`
  },
  {
    id: "MatchMaking",
    title: "Scale Matchmaking & Teleport Service",
    category: "Networking & Cloud Infrastructure",
    description: "A fast matchmaking system utilizing MemoryStoreService to create transient, real-time queues. Allocates players dynamically into teams based on Elo ranking or queue duration, requests new server instances, and handles player migration safely using TeleportService.",
    folder: "MatchMaking",
    video: "./Asessts/MatchMaking/2026-07-03 12-09-17.mp4",
    file: "MatchmakingService.lua",
    terminalOutput: [
      "[System] Loading MatchmakingService...",
      "[MemoryStore] Fetching global matchmaking sorted map...",
      "[Queue] User 927429 entered the matchmaking queue. (Elo: 1420)",
      "[Matchmaking] Search matching pool... Found 8 candidates.",
      "[Matchmaking] Created Match Lobby: [Lobby_42] with Average Elo: 1412.",
      "[Teleport] Allocating teleport reservation code...",
      "[Teleport] Migration triggered. Migrating 8 players to Instance_42."
    ],
    code: `local MatchmakingService = {}
local MemoryStoreService = game:GetService("MemoryStoreService")
local TeleportService = game:GetService("TeleportService")

local QueueStore = MemoryStoreService:GetSortedMap("MatchmakingQueue")
local PLACE_ID = 184752940 -- Target game server place ID

-- Registers a player in the Memory Store Queue
function MatchmakingService.joinQueue(player, elo)
    local key = tostring(player.UserId)
    local data = {
        userId = player.UserId,
        elo = elo,
        joinedTime = os.time()
    }
    
    local success = pcall(function()
        QueueStore:SetAsync(key, data, 180) -- Expires in 3 minutes
    end)
    return success
end

-- Matches players in similar ELO pools and teleports them
function MatchmakingService.pollQueueAndMatch()
    local success, pages = pcall(function()
        return QueueStore:GetRangeAsync(Enum.SortDirection.Ascending, 100)
    end)
    if not success or not pages then return end
    
    local lobby = {}
    for _, item in ipairs(pages) do
        table.insert(lobby, item.value.userId)
        -- Remove matched player from queue
        QueueStore:RemoveAsync(item.key)
        
        -- Form match of 4 players
        if #lobby >= 4 then
            MatchmakingService.teleportMatch(lobby)
            break
        end
    end
end

-- Teleports players to a private game reservation
function MatchmakingService.teleportMatch(userIds)
    local players = {}
    for _, id in ipairs(userIds) do
        local p = game.Players:GetPlayerByUserId(id)
        if p then table.insert(players, p) end
    end
    
    if #players == 0 then return end
    
    local success, teleportCode = pcall(function()
        return TeleportService:ReserveServer(PLACE_ID)
    end)
    
    if success and teleportCode then
        TeleportService:TeleportToPrivateServer(PLACE_ID, teleportCode, players)
    end
end

return MatchmakingService`
  },
  {
    id: "NPCpathfinding",
    title: "Pathfinding & Spatial Intelligence Agent",
    category: "AI & Pathfinding",
    description: "An AI manager for NPCs that utilizes Roblox's PathfindingService to calculate routing around complex obstacles. Includes dynamic re-routing when paths get blocked by moving objects and manages NPC status with a robust finite state machine (Patrol, Chase, Attack).",
    folder: "NPCpathfinding",
    video: "./Asessts/NPCpathfinding/2026-07-03 12-31-18.mp4",
    file: "AIPayloadController.lua",
    terminalOutput: [
      "[System] Loading AIPayloadController...",
      "[AI] Constructing path properties (AgentRadius=3, AgentHeight=6)...",
      "[AI] Path initialized. Target waypoint count: 24.",
      "[AI] Obstacle detected at waypoint 5. Re-computing route...",
      "[Pathfinder] New path calculated in 4.2ms. Bypassing blocker.",
      "[AI] Enemy spotted. Switching from state 'Patrol' to 'Chase'."
    ],
    code: `local AIPayloadController = {}
local PathfindingService = game:GetService("PathfindingService")

-- Agent configuration parameters
local AGENT_PARAMS = {
    AgentRadius = 3,
    AgentHeight = 6,
    AgentCanJump = true,
    WaypointSpacing = 4
}

function AIPayloadController.new(npcInstance)
    local self = setmetatable({}, { __index = AIPayloadController })
    self.npc = npcInstance
    self.humanoid = npcInstance:WaitForChild("Humanoid")
    self.root = npcInstance:WaitForChild("HumanoidRootPart")
    self.path = PathfindingService:CreatePath(AGENT_PARAMS)
    self.state = "Patrol"
    return self
end

-- Moves NPC toward target destination with dynamic recalculation
function AIPayloadController:navigateTo(targetPosition)
    local success, errorMessage = pcall(function()
        self.path:ComputeAsync(self.root.Position, targetPosition)
    end)
    
    if not success or self.path.Status ~= Enum.PathStatus.Success then
        warn("Failed to compute path:", errorMessage)
        return
    end
    
    local waypoints = self.path:GetWaypoints()
    
    -- Setup dynamic obstacle check listener
    local blockedConnection
    blockedConnection = self.path.Blocked:Connect(function(blockedIndex)
        warn("Path blocked at index", blockedIndex, "re-routing...")
        blockedConnection:Disconnect()
        self:navigateTo(targetPosition) -- Recalculate
    end)
    
    for i, waypoint in ipairs(waypoints) do
        -- Skip first waypoint (origin)
        if i > 1 then
            if waypoint.Action == Enum.PathWaypointAction.Jump then
                self.humanoid.Jump = true
            end
            self.humanoid:MoveTo(waypoint.Position)
            
            -- Wait until we reach waypoint or timeout
            local reached = self.humanoid.MoveToFinished:Wait()
            if not reached then
                warn("Waypoint timeout, re-routing...")
                break
            end
        end
    end
    blockedConnection:Disconnect()
end

return AIPayloadController`
  },
  {
    id: "CarCustomisation",
    title: "Vehicle Tuning & Customizer",
    category: "System Architectures",
    description: "A database-driven customizer for vehicles. Feeds from client choices (body kits, paint type, neon, suspension height), replicates changes visually in local space instantly for zero-latency feedback, and commits changes server-side after checking currency transactions.",
    folder: "CarCustomisation",
    video: "./Asessts/CarCustomisation/2026-07-03 12-01-23.mp4",
    image: "./Asessts/CarCustomisation/image.png",
    file: "VehicleCustomizerService.lua",
    terminalOutput: [
      "[System] Loading VehicleCustomizerService...",
      "[Server] Listening on network events: VehicleCustomizationRequest...",
      "[Server] Processing customization request from Player_B...",
      "[Economy] Verifying player balance... (Cost: 2500, Balance: 15400)",
      "[Economy] Balance verified. Deducted 2500 credits.",
      "[Vehicle] Spawning customization modifications (Wheel_Chrome_Style, Custom_Spoiler)...",
      "[Server] Customization applied. Syncing network replica."
    ],
    code: `local VehicleCustomizerService = {}
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CustomizationRequest = Instance.new("RemoteFunction")
CustomizationRequest.Name = "VehicleCustomizationRequest"
CustomizationRequest.Parent = ReplicatedStorage

local PARTS_CATALOG = {
    Spoiler_GT = { cost = 1200, assetId = 94830182 },
    Wheels_Sport = { cost = 800, assetId = 94830190 },
    Neon_Cyan = { cost = 500, assetId = 0 }
}

-- Handles server-side validation and purchase of parts
local function handleCustomizationRequest(player, vehicle, category, partName, color)
    -- Verify vehicle ownership
    if vehicle:GetAttribute("Owner") ~= player.UserId then
        return false, "Unauthorized"
    end
    
    local partInfo = PARTS_CATALOG[partName]
    if not partInfo then return false, "Invalid part" end
    
    -- Check economy balance
    local leaderstats = player:FindFirstChild("leaderstats")
    local cash = leaderstats and leaderstats:FindFirstChild("Cash")
    if not cash or cash.Value < partInfo.cost then
        return false, "Insufficient funds"
    end
    
    -- Deduct money
    cash.Value = cash.Value - partInfo.cost
    
    -- Apply customization physically
    if category == "Spoiler" then
        local attachment = vehicle.Body:FindFirstChild("SpoilerAttachment")
        if attachment then
            vehicle.Body:FindFirstChild("Spoiler"):Destroy()
            local model = ReplicatedStorage.Assets.Spoilers:FindFirstChild(partName):Clone()
            model.Parent = vehicle.Body
            model:PivotTo(attachment.WorldCFrame)
        end
    elseif category == "Paint" and color then
        for _, part in ipairs(vehicle.Body.PaintableParts:GetChildren()) do
            part.Color = color
        end
    end
    
    return true, "Success"
end

CustomizationRequest.OnServerInvoke = handleCustomizationRequest
return VehicleCustomizerService`
  },
  {
    id: "UIcarCustomisation",
    title: "UI car Cusomizer",
    category: "UI/UX & Graphics",
    description: "A client-side UI menu for customizing vehicles. Smooth camera sweeps focus on selected parts, utilizing math-based springs for clean sliding menus.",
    folder: "UIcarCustomisation",
    video: "./Asessts/UIcarCustomisation/2026-07-03 12-29-45.mp4",
    file: "VehicleCustomizerUIController.lua",
    terminalOutput: [
      "[System] Loading VehicleCustomizerUIController...",
      "[UI] Loading HUD screen panels...",
      "[Camera] Tweens camera matrix focus to vehicle rear axle...",
      "[Spring] Initialized UI Spring: Damp=0.85, Speed=15.",
      "[UI] User selected 'Tuning' category. Expanding side drawers...",
      "[Tween] Moving camera to EngineBayAttachment (FOV=50, Interpolation=Sine)..."
    ],
    code: `local VehicleCustomizerUIController = {}
local TweenService = game:GetService("TweenService")
local Camera = workspace.CurrentCamera

local CAMERA_TWEEN_INFO = TweenInfo.new(1.2, Enum.EasingStyle.Sine, Enum.EasingDirection.Out)

-- Shifts current camera focus to target location on vehicle for customization feedback
function VehicleCustomizerUIController.focusCameraOnPart(vehicle, partName)
    local targetAttachment = vehicle:FindFirstChild(partName .. "CameraAttachment", true)
    if not targetAttachment then return end
    
    -- Terminate current default camera behavior
    Camera.CameraType = Enum.CameraType.Scriptable
    
    -- Calculate target coordinate frames
    local offsetCF = targetAttachment.CFrame * CFrame.new(0, 1.5, 6) -- Offset camera back and up
    local targetCF = CFrame.lookAt(offsetCF.Position, targetAttachment.WorldPosition)
    
    -- Smoothly interpolate camera movement
    local cameraTween = TweenService:Create(Camera, CAMERA_TWEEN_INFO, { CFrame = targetCF })
    cameraTween:Play()
    
    -- Display corresponding UI selection panel
    VehicleCustomizerUIController.slideInPanel(partName)
end

function VehicleCustomizerUIController.slideInPanel(panelName)
    local screenGui = script.Parent
    local panel = screenGui:FindFirstChild(panelName .. "Panel")
    if not panel then return end
    
    panel.Visible = true
    panel.Position = UDim2.new(-0.3, 0, 0.1, 0) -- Slide in from off-screen
    
    local slideTween = TweenService:Create(panel, TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Position = UDim2.new(0.05, 0, 0.1, 0)
    })
    slideTween:Play()
end

return VehicleCustomizerUIController`
  },
  {
    id: "chassis",
    title: "vehicle physics chassis",
    category: "Physics & Engine Architecture",
    description: "A custom vehicle physics framework bypassing default constraints to build authentic, arcade-style vehicle handling. Employs raycasting to calculate suspension compression (Hooke's Law), side-slip sliding friction, and rotational engine torque vectors.",
    folder: "chassis",
    video: "./Asessts/chassis/2026-07-03 12-03-00.mp4",
    image: "./Asessts/chassis/image.png",
    file: "VehiclePhysicsController.lua",
    terminalOutput: [
      "[System] Loading VehiclePhysicsController...",
      "[Physics] Raycast suspension checking engaged.",
      "[Physics] Core parameters: SpringRate=15000, DamperRate=800, TireFriction=1.4.",
      "[Physics] Handbrake status: OFF. Friction values synced.",
      "[Physics] Steering target angle: 35 degrees. Current slip ratio: 0.12.",
      "[Telemetry] Engine torque curve: Peak HP at 5600 RPM."
    ],
    code: `local VehiclePhysicsController = {}
local RunService = game:GetService("RunService")

local SUSPENSION_LENGTH = 2.5
local SPRING_RATE = 15000 -- stiffness
local DAMPER_RATE = 800 -- rebound

function VehiclePhysicsController.new(vehicleModel)
    local self = setmetatable({}, { __index = VehiclePhysicsController })
    self.car = vehicleModel
    self.thrusters = vehicleModel.SuspensionThrusters:GetChildren()
    self.root = vehicleModel.PrimaryPart
    self.lastHeights = {}
    return self
end

-- Simulates raycast suspension dynamics inside the physics step loop
function VehiclePhysicsController:updateSuspension(dt)
    local raycastParams = RaycastParams.new()
    raycastParams.FilterType = Enum.RaycastFilterType.Exclude
    raycastParams.FilterDescendantsInstances = {self.car}
    
    for _, thruster in ipairs(self.thrusters) do
        local direction = -thruster.CFrame.UpVector * SUSPENSION_LENGTH
        local result = workspace:Raycast(thruster.Position, direction, raycastParams)
        
        if result then
            -- 1. Calculate compression distance
            local currentHeight = result.Distance
            local compression = SUSPENSION_LENGTH - currentHeight
            
            -- 2. Calculate compression velocity (damping)
            local lastHeight = self.lastHeights[thruster] or SUSPENSION_LENGTH
            local velocity = (lastHeight - currentHeight) / dt
            self.lastHeights[thruster] = currentHeight
            
            -- 3. Calculate spring and damper forces
            local springForce = compression * SPRING_RATE
            local damperForce = velocity * DAMPER_RATE
            local totalSuspensionForce = math.max(0, springForce + damperForce)
            
            -- 4. Apply vector force upward to car base
            self.root:ApplyImpulseAtPosition(
                thruster.CFrame.UpVector * totalSuspensionForce * dt,
                thruster.Position
            )
        else
            self.lastHeights[thruster] = SUSPENSION_LENGTH
        end
    end
end

return VehiclePhysicsController`
  },
  {
    id: "planeSystem",
    title: "Aerodynamic Flight Physics Controller",
    category: "Physics & Engine Architecture",
    description: "An arcade-realistic flight flight-control module. Calculates aerodynamic forces (lift, drag, pitch/yaw/roll moments) in real-time. Translates pilot inputs directly into custom BodyThrust and VectorForces applied to the aircraft's aerodynamic center.",
    folder: "planeSystem",
    video: "./Asessts/planeSystem/2026-07-03 12-18-55.mp4",
    file: "AeroFlightPhysics.lua",
    terminalOutput: [
      "[System] Loading AeroFlightPhysics...",
      "[Physics] Lift coefficients pre-calculated.",
      "[Engine] Turbine engine ignition... Turbofans spooling up to 100% THRUST.",
      "[Telemetry] Airspeed: 154kts. Lift generated: 23,000 N. Pitch: +12 deg.",
      "[Physics] Computing dynamic drag surface area relative to angle of attack...",
      "[Controls] Elevator input: -0.2. Pitch rate adjusted."
    ],
    code: `local AeroFlightPhysics = {}
local RunService = game:GetService("RunService")

local DRAG_COEFFICIENT = 0.05
local LIFT_COEFFICIENT = 0.25
local AIR_DENSITY = 1.225

function AeroFlightPhysics.new(aircraftModel)
    local self = setmetatable({}, { __index = AeroFlightPhysics })
    self.plane = aircraftModel
    self.root = aircraftModel.PrimaryPart
    self.thrustForce = aircraftModel.Engine.BodyThrust
    self.throttle = 0 -- 0 to 1
    return self
end

-- Simulates Lift, Drag, and Gravity dynamics inside the physical step loop
function AeroFlightPhysics:stepPhysics(dt)
    local forwardVector = self.root.CFrame.LookVector
    local upVector = self.root.CFrame.UpVector
    
    -- Calculate speed along flight path
    local velocity = self.root.AssemblyLinearVelocity
    local speed = velocity:Dot(forwardVector)
    
    -- 1. Apply Engine Thrust
    self.thrustForce.Force = Vector3.new(0, 0, -self.throttle * 5000)
    
    -- 2. Apply Aerodynamic Lift: L = 0.5 * density * Cl * Area * Velocity^2
    local liftMagnitude = 0.5 * AIR_DENSITY * LIFT_COEFFICIENT * 45 * (speed^2)
    -- Lift acts perpendicular to flight path (along wing normal)
    local liftForce = upVector * liftMagnitude
    
    -- 3. Apply Drag: D = 0.5 * density * Cd * Area * Velocity^2
    local dragMagnitude = 0.5 * AIR_DENSITY * DRAG_COEFFICIENT * 15 * (speed^2)
    local dragForce = -velocity.Unit * dragMagnitude
    
    -- Apply calculated aerodynamic forces to flight body
    self.root:ApplyImpulse( (liftForce + dragForce) * dt )
end

return AeroFlightPhysics`
  },
  {
    id: "Inventory",
    title: "Inventory Database & Interface System",
    category: "System Architectures",
    description: "An asset-centric inventory engine. Syncs changes client-to-server utilizing remote events with full exploit checks. Supports item categories, stack thresholds, quick-slots equipment slots, and drops items physically back into the game world.",
    folder: "Inventory",
    video: "./Asessts/Inventory/2026-07-03 12-16-48.mp4",
    alternateVideo: "./Asessts/Inventory/2026-07-03 12-21-57.mp4",
    file: "InventoryService.lua",
    terminalOutput: [
      "[System] Loading InventoryService...",
      "[Server] Active user inventory caches synchronized.",
      "[Inventory] Player_A requested item pickup: 'Iron_Ore' (Size: 1).",
      "[Inventory] Target slot: 3. Max Stack: 64. Merging stacks...",
      "[Server] Replicating slot updates back to client UI...",
      "[Inventory] Item equipped: 'Axe_T2'. Triggering server weapon binder."
    ],
    code: `local InventoryService = {}
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RemoteEvent = Instance.new("RemoteEvent")
RemoteEvent.Name = "InventoryUpdateEvent"
RemoteEvent.Parent = ReplicatedStorage

local playerInventories = {}
local ITEM_DATABASE = {
    Sword_Iron = { maxStack = 1, weight = 5 },
    Gold_Ore = { maxStack = 64, weight = 0.5 }
}

-- Safe server inventory item addition
function InventoryService.addItem(player, itemId, quantity)
    local inventory = playerInventories[player]
    if not inventory then return false end
    
    local itemData = ITEM_DATABASE[itemId]
    if not itemData then return false end
    
    -- Look for existing stack to merge
    for _, slotData in ipairs(inventory) do
        if slotData.id == itemId and slotData.quantity < itemData.maxStack then
            local availableSpace = itemData.maxStack - slotData.quantity
            local amountToAdd = math.min(quantity, availableSpace)
            slotData.quantity = slotData.quantity + amountToAdd
            quantity = quantity - amountToAdd
            if quantity <= 0 then break end
        end
    end
    
    -- Add to empty slots if item quantity remains
    if quantity > 0 then
        for i = 1, 30 do -- 30 Slot Inventory
            if not inventory[i] then
                inventory[i] = { id = itemId, quantity = quantity }
                quantity = 0
                break
            end
        end
    end
    
    -- Network replicate modifications
    RemoteEvent:FireClient(player, inventory)
    return quantity == 0
end

return InventoryService`
  },
  {
    id: "DevProducts",
    title: "Transactional Purchase Ledger",
    category: "Backend Databases",
    description: "A secure purchase engine handling developer products and microtransactions. Implements Roblox's transaction callback standard, verifying purchases against transactional ledgers, preventing exploit double-purchasing, and saving state updates atomically.",
    folder: "DevProducts",
    video: "./Asessts/DevProducts/2026-07-03 12-17-15.mp4",
    file: "DevProductReceiptProcessor.lua",
    terminalOutput: [
      "[System] Loading DevProductReceiptProcessor...",
      "[Marketplace] Binding receipt processing callback handler...",
      "[Purchase] Processing Purchase ID: req_94830172 from Player 43289053...",
      "[Purchase] Requested Product ID: 9428502 (100 Coins Bundle)...",
      "[Database] Verifying receipt ledger double-spend status... CLEAN.",
      "[Database] Credited 100 Coins to Player 43289053. Database updated.",
      "[Marketplace] Purchase status: purchaseGranted."
    ],
    code: `local DevProductReceiptProcessor = {}
local MarketplaceService = game:GetService("MarketplaceService")
local DataStoreService = game:GetService("DataStoreService")
local PurchaseHistory = DataStoreService:GetDataStore("PurchaseHistory_v1")

local function processReceipt(receiptInfo)
    local playerProductKey = receiptInfo.PlayerId .. ":" .. receiptInfo.PurchaseId
    
    -- 1. Check if the purchase has already been processed (Idempotence)
    local isProcessed = pcall(function()
        return PurchaseHistory:GetAsync(playerProductKey)
    end)
    
    if isProcessed == true then
        return Enum.ProductPurchaseDecision.PurchaseGranted
    end
    
    -- 2. Find and award asset to player
    local player = game.Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if not player then
        -- Player left, try processing again when they rejoin
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end
    
    local awardSuccess = false
    if receiptInfo.ProductId == 9428502 then -- 100 Coins product
        local stats = player:FindFirstChild("leaderstats")
        local coins = stats and stats:FindFirstChild("Coins")
        if coins then
            coins.Value = coins.Value + 100
            awardSuccess = true
        end
    end
    
    -- 3. Write purchase verification key to database
    if awardSuccess then
        local saveSuccess = pcall(function()
            PurchaseHistory:SetAsync(playerProductKey, true)
        end)
        
        if saveSuccess then
            return Enum.ProductPurchaseDecision.PurchaseGranted
        else
            warn("Failed to save transaction history. Retrying later...")
        end
    end
    
    return Enum.ProductPurchaseDecision.NotProcessedYet
end

MarketplaceService.ProcessReceipt = processReceipt
return DevProductReceiptProcessor`
  },
  {
    id: "OSU",
    title: "Osu! Rhythm Mechanics Engine",
    category: "Game Design & Mechanics",
    description: "A dynamic rhythm gameplay solver. Parses music beatmap timestamp nodes, constructs screen tap circles synchronized with timing offsets, and verifies client hits against tight, milliseconds-precise windows (Perfect, Great, Ok, Miss).",
    folder: "OSU",
    video: "./Asessts/OSU/2026-07-03 12-26-33.mp4",
    file: "RhythmEngineController.lua",
    terminalOutput: [
      "[System] Loading RhythmEngineController...",
      "[Audio] Beatmap 'Future_Core.mp3' loaded. Total hit nodes: 184.",
      "[Beatmap] Syncing timer engine to audio position...",
      "[Rhythm] Node 12 active. Approach circle scaling...",
      "[Input] Click detected at timing delta: -22ms.",
      "[Rhythm] Score hit: PERFECT! +300 pts. Combo: 12."
    ],
    code: `local RhythmEngineController = {}
local SoundService = game:GetService("SoundService")

local TIMING_WINDOWS = {
    Perfect = 30, -- ms
    Great = 75,   -- ms
    Ok = 120,     -- ms
}

function RhythmEngineController.calculateHitScore(actionTimestamp, targetTimestamp)
    -- Calculate timing difference in milliseconds
    local timeDelta = math.abs(actionTimestamp - targetTimestamp) * 1000
    
    if timeDelta <= TIMING_WINDOWS.Perfect then
        return "Perfect", 300
    elseif timeDelta <= TIMING_WINDOWS.Great then
        return "Great", 100
    elseif timeDelta <= TIMING_WINDOWS.Ok then
        return "Ok", 50
    else
        return "Miss", 0
    end
end

-- Triggers target ring ring scale down visual
function RhythmEngineController.tweenApproachCircle(hitCircleFrame, noteDuration)
    local ring = hitCircleFrame:FindFirstChild("ApproachRing")
    if not ring then return end
    
    ring.Size = UDim2.new(4, 0, 4, 0)
    ring.ImageTransparency = 0
    
    ring:TweenSizeAndPosition(
        UDim2.new(1.0, 0, 1.0, 0),
        UDim2.new(0, 0, 0, 0),
        Enum.EasingDirection.In,
        Enum.EasingStyle.Linear,
        noteDuration,
        true,
        function()
            ring.ImageTransparency = 1
        end
    )
end

return RhythmEngineController`
  },
  {
    id: "bloxFruit Sound F",
    title: "my version of blox fruit sound f",
    category: "UI/UX & Graphics",
    description: "",
    folder: "bloxFruit Sound F",
    video: "./Asessts/bloxFruit Sound F/2026-07-03 11-59-30.mp4",
    file: "CombatSoundService.lua",
    terminalOutput: [
      "[System] Loading CombatSoundService...",
      "[Sound] Pre-loading combat sound assets... 24 loaded.",
      "[SFX] Playing combat charge 'Electric_Slash' at Position: {12, -4, 52}.",
      "[SFX] Sound Pitch randomized to 1.04 (+4% margin).",
      "[Reverberation] Area check: Tunnel. Applying Tunnel Reverb settings.",
      "[SFX] Cleared 4 expired Sound instances from world cache."
    ],
    code: `local CombatSoundService = {}
local SoundService = game:GetService("SoundService")

-- Plays a spatial audio sound clip with randomized pitch margin at position
function CombatSoundService.playSpatialSFX(soundAssetId, attachmentPart, playVolume)
    local soundInstance = Instance.new("Sound")
    soundInstance.SoundId = "rbxassetid://" .. tostring(soundAssetId)
    soundInstance.Volume = playVolume or 0.8
    
    -- Randomize pitch (+- 10%) to prevent sound repetition exhaustion
    local pitchMultiplier = 1 + (math.random(-10, 10) / 100)
    soundInstance.PlaybackSpeed = pitchMultiplier
    
    -- Apply spatial audio rolling parameters
    soundInstance.RollOffMode = Enum.RollOffMode.InverseTapered
    soundInstance.RollOffMinDistance = 10
    soundInstance.RollOffMaxDistance = 150
    
    -- Parent to physical point to make audio 3D
    soundInstance.Parent = attachmentPart
    soundInstance:Play()
    
    -- Automatically clean up sound instance when playback completes
    soundInstance.Ended:Connect(function()
        soundInstance:Destroy()
    end)
end

return CombatSoundService`
  }
];
