// evo logic
let entities = []

function setupEvo() {
  for (let i = 0; i < 20; i++) {
    entities.push(new People({
      pos: {
        x: CONFIG.WIDTH * Math.random(),
        y: CONFIG.HEIGHT * Math.random()
      }
    }))
  }
  for (let i = 0; i < 0; i++) {
    entities.push(new Food({
      pos: {
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * CONFIG.HEIGHT,
      }
    }))
  }
}

function iterateEvo() {
  // Add more food
  if (Math.random() < 1 / CONFIG.FRAMERATE) {
    entities.push(new Food({
      pos: {
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * CONFIG.HEIGHT,
      }
    }))
  }
  // Iterate actions
  entities.forEach(entity => entity.iterate())
  // Collision
  for (let i = 0; i < entities.length; i++) {
    let entityOne = entities[i]
    for (let j = i + 1; j < entities.length; j++) {
      let entityTwo = entities[j]
      if (2 * entityOne.distance(entityTwo) > entityOne.size() + entityTwo.size()) continue
      collide(entityOne, entityTwo)
    }
  }
  // Update position
  entities.forEach(entity => entity.move())
  entities.filter(entity => entity.isDead()).forEach(entity => entity.beforeDie())
  entities = entities.filter(entity => !entity.isDead())
}


// Helper functions
function collide (entityOne, entityTwo) {
  if (entityOne.type === ENTITY_TYPE.PEOPLE && entityTwo.type === ENTITY_TYPE.PEOPLE) {
    // people-people
    if (entityOne.isBreedable() && entityTwo.isBreedable()) {
      breed(entityOne, entityTwo)
      entityOne._showEnergy = true
      entityTwo._showEnergy = true
    }
    performCollision(entityOne, entityTwo)
  } else if (entityOne.type === ENTITY_TYPE.PEOPLE && entityTwo.type === ENTITY_TYPE.FOOD) {
    // people-food
    entityTwo.dead = true
    entityOne.energy += entityTwo.energy
    entityOne._showEnergy = true
  } else if (entityOne.type === ENTITY_TYPE.FOOD && entityTwo.type === ENTITY_TYPE.PEOPLE) {
    // food-people
    entityOne.dead = true
    entityTwo.energy += entityOne.energy
    entityTwo._showEnergy = true
  }
}

// updates the velocities of the entities, assuming elastic collision
function performCollision (entityOne, entityTwo) {
  const dx = entityTwo.pos.x - entityOne.pos.x
  const dy = entityTwo.pos.y - entityOne.pos.y
  const theta = Math.atan2(dy, dx)

  // Masses
  const m1 = entityOne.mass
  const m2 = entityTwo.mass
  // Initial velocity for entity one, parallel and perpendicular to the direction
  const u1 = [
    entityOne.velocity.x * Math.cos(theta) + entityOne.velocity.y * Math.sin(theta),
    entityOne.velocity.x * Math.sin(theta) - entityOne.velocity.y * Math.cos(theta)
  ]
  const u2 = [
    entityTwo.velocity.x * Math.cos(theta) + entityTwo.velocity.y * Math.sin(theta),
    entityTwo.velocity.x * Math.sin(theta) - entityTwo.velocity.y * Math.cos(theta)
  ]

  if (u1 < u2) {
    return
  }
  const v1 = [
    (2 * m2 * u2[0] - (m2 - m1) * u1[0]) / (m1 + m2),
    u1[1]
  ]
  const v2 = [
    (2 * m1 * u1[0] - (m1 - m2) * u2[0]) / (m1 + m2),
    u2[1]
  ]

  entityOne.velocity.x = v1[0] * Math.cos(theta) + v1[1] * Math.sin(theta)
  entityOne.velocity.y = v1[0] * Math.sin(theta) - v1[1] * Math.cos(theta)
  entityTwo.velocity.x = v2[0] * Math.cos(theta) + v2[1] * Math.sin(theta)
  entityTwo.velocity.y = v2[0] * Math.sin(theta) - v2[1] * Math.cos(theta)
}

// Miscellaneous functions
function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() // + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}