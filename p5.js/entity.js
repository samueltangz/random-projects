const EPSILON = 1e-8
const ENTITY_TYPE = {
  FOOD: 1,
  PEOPLE: 2
}

class Entity {
  constructor(data) {
    data.pos = data.pos || {}
    this.pos = {
      x: data.pos.x || (CONFIG.WIDTH / 2),
      y: data.pos.y || (CONFIG.HEIGHT / 2)
    }
    data.velocity = data.velocity || {}
    this.velocity = {
      x: data.velocity.x || 0,
      y: data.velocity.y || 0
    }
    this.acceleration = data.acceleration || (Math.random() * 200)
    this.mass = data.mass || (0.001 + Math.random() * 0.099)
    this.uuid = uuid()
  }
  distance (entity) {
    const dx = this.pos.x - entity.pos.x
    const dy = this.pos.y - entity.pos.y
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
  }
  color () {
    return [ 0, 0, 0, 255 ]
  }
  size () {
    return 10
  }
  draw () {
    fill(color(...this.color()))
    noStroke()
    circle(this.pos.x, this.pos.y, this.size())
  }
  iterate () {}
  move () {
    const vx = this.velocity.x
    const vy = this.velocity.y
    const v = Math.sqrt(vx*vx + vy*vy)
    const ux = vx / v
    const uy = vy / v
    if (v < EPSILON) return
    if (v > this.maxSpeed) {
      this.velocity.x = ux * this.maxSpeed
      this.velocity.y = uy * this.maxSpeed
    }
    this.pos.x += this.velocity.x / CONFIG.FRAMERATE
    this.pos.y += this.velocity.y / CONFIG.FRAMERATE

    if (this.pos.x < this.size() / 2) {
      // collide with the left wall
      this.pos.x = this.size() / 2
      this.velocity.x *= -1
    } else if (this.pos.x > CONFIG.WIDTH - this.size() / 2) {
      // collide with the right wall
      this.pos.x = CONFIG.WIDTH - this.size() / 2
      this.velocity.x *= -1
    }
    if (this.pos.y < this.size() / 2) {
      // collide with the top wall
      this.pos.y = this.size() / 2
      this.velocity.y *= -1
    } else if (this.pos.y > CONFIG.HEIGHT - this.size() / 2) {
      // collide with the bottom wall
      this.pos.y = CONFIG.HEIGHT - this.size() / 2
      this.velocity.y *= -1
    }
  }
  beforeDie () {}
  _moveTowards (pos) {
    const dx = pos.x - this.pos.x
    const dy = pos.y - this.pos.y
    const d = Math.sqrt(dx*dx + dy*dy)
    if (d < EPSILON) return
    const ux = dx / d
    const uy = dy / d
    const a = this.acceleration / CONFIG.FRAMERATE
    this.velocity.x += ux * a
    this.velocity.y += uy * a
  }
  _standStill () {
    const vx = this.velocity.x 
    const vy = this.velocity.y
    const v = Math.sqrt(vx*vx + vy*vy)
    if (v < EPSILON) return
    const ux = vx / v
    const uy = vy / v
    const a = this.acceleration / CONFIG.FRAMERATE
    if (vx * (vx - ux * a) < 0) {
      this.velocity.x = 0
      this.velocity.y = 0
    } else {
      this.velocity.x = vx - ux * a
      this.velocity.y = vy - uy * a
    }
  }
}

class Food extends Entity {
  constructor(data) {
    super(data)
    this.type = ENTITY_TYPE.FOOD
    this.energy = data.energy || (10000 + Math.random() * 10000)
    this.acceleration = 1000000.0
  }
  isDead () {
    return this.dead
  }
  color () {
    return [ 255, 215, 0, 255 ]
  }
  size () {
    return 5 + Math.pow(this.energy / 1000, 0.5)
  }
}

class People extends Entity {
  constructor(data) {
    super(data)
    this.type = ENTITY_TYPE.PEOPLE
    this.energy = data.energy || 100000
    this.eyesight = data.eyesight || (Math.random() * 2000)
    this.maxSpeed = data.maxSpeed || (Math.random() * 1000)
    this.breedThreshold = data.breedThreshold || (Math.random() * 400000 + 100000)
    this.generation = data.generation || 0
    this.parents = data.parents || []
    this.offsprings = 0
    this._maxEnergy = 0
  }
  isDead () {
    return this.energy <= 0
  }
  beforeDie () {
    entities.push(new Food({ pos: this.pos, energy: this._maxEnergy }))
  }
  color () {
    let r = Math.min(Math.max(this.eyesight / 2000 * 256, 0), 256)
    let g = Math.min(Math.max(this.maxSpeed / 1000 * 256, 0), 256)
    let b = Math.min(Math.max(this.acceleration / 200 * 256, 0), 256)
    let a = Math.min(Math.max(this.mass / 0.1 * 256, 0), 256)
    return [ r, g, b, a ]
  }
  size () {
    return 10 + Math.sqrt(Math.max(this.energy, 0) / 4000)
  }
  draw () {
    fill(color(...this.color()))
    if (selectedEntity === this.uuid) {
      strokeWeight(3)
      stroke(255, 0, 0, 64)
    } else {
      noStroke()
    }
    circle(this.pos.x, this.pos.y, this.size())
    stroke(...this.color())
    strokeWeight(3)
    line(this.pos.x, this.pos.y, this.pos.x + this.velocity.x / 20, this.pos.y + this.velocity.y / 20)
    noStroke()
    if (this.isBreedable()) {
      fill(255, 0, 0)
      textAlign(CENTER)
      textSize(12)
      text('♥', this.pos.x, this.pos.y + 4)
    }
    fill(0)

    if (this._showEnergy || true) {
      textSize(12)
      textAlign(CENTER)
      text(
        this.energy.toFixed(0),
        this.pos.x - 20, this.pos.y - 14 - this.size() / 2, 40, 20
      )
      this._showEnergy = false
    }
  }
  iterate () {
    let candidateEntities = _.cloneDeep(entities)
    if (this.isBreedable()) {
      // want to breed
      candidateEntities = candidateEntities
        .filter(entity => this.distance(entity) <= this.eyesight)
        .filter(entity => {
          return (entity.type === ENTITY_TYPE.PEOPLE && entity.isBreedable() && entity.uuid !== this.uuid) || entity.type === ENTITY_TYPE.FOOD
        })
        .sort((entityOne, entityTwo) => this.distance(entityOne) - this.distance(entityTwo))
      if (candidateEntities.length > 0) {
        this._moveTowards(candidateEntities[0].pos)
      } else {
        this._standStill()
      }
    } else {
      // want to eat
      candidateEntities = candidateEntities
        .filter(entity => this.distance(entity) <= this.eyesight)
        .filter(entity => entity.type === ENTITY_TYPE.FOOD)
        .sort((entityOne, entityTwo) => this.distance(entityOne) - this.distance(entityTwo))
      if (candidateEntities.length > 0) {
        this._moveTowards(candidateEntities[0].pos)
      } else {
        this._standStill()
      }      
    }
    // consumes energy
    const energyLevel = Math.floor(this.energy / 10000)
    this.energy -= 0.5 * this.mass * (Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2)) / CONFIG.FRAMERATE
    this.energy -= 1000 / CONFIG.FRAMERATE
    const newEnergyLevel = Math.floor(this.energy / 10000)
    if (energyLevel !== newEnergyLevel) this._showEnergy = true
    this._maxEnergy = Math.max(this._maxEnergy, this.energy)
  }
  isBreedable () {
    return this.energy >= this.breedThreshold
  }
}

function breed (peopleOne, peopleTwo) {
  const x = (peopleOne.pos.x + peopleTwo.pos.x) / 2
  const y = (peopleOne.pos.y + peopleTwo.pos.y) / 2
  entities.push(new People({
    pos: { x, y },
    velocity: { x: 0, y: 0 },
    acceleration: randomStat(peopleOne.acceleration, peopleTwo.acceleration),
    mass: randomStat(peopleOne.mass, peopleTwo.mass),
    eyesight: randomStat(peopleOne.eyesight, peopleTwo.eyesight),
    maxSpeed: randomStat(peopleOne.maxSpeed, peopleTwo.maxSpeed),
    breedThreshold: randomStat(peopleOne.breedThreshold, peopleTwo.breedThreshold),
    generation: Math.max(peopleOne.generation, peopleTwo.generation) + 1,
    parents: [ peopleOne.uuid, peopleTwo.uuid ]
  }))
  peopleOne.energy -= 50000
  peopleOne.offsprings += 1
  peopleTwo.energy -= 50000
  peopleTwo.offsprings += 1
  /*
    this.acceleration = data.acceleration || (Math.random() * 200)
    this.mass = data.mass || (0.001 + Math.random() * 0.099)
    this.energy = data.energy || 100000
    this.eyesight = data.eyesight || (200 + Math.random() * 1800)
    this.maxSpeed = data.maxSpeed || (Math.random() * 1000)
    this.breedThreshold = data.breedThreshold || 250000
  */
}

function randomStat (valueOne, valueTwo) {
  const mean = (valueOne + valueTwo) * 0.5
  const diff = Math.abs(valueOne - valueTwo) * 0.6
  while (true) {
    let val = mean
    for (let i = 0; i < 2; i++) {
      val += 2 * (Math.random() - 0.5) * diff
    }
    if (val > 0) return val
  }
}

/*
..Tank
{"acceleration":1747.0618783957202,"mass":0.1,"eyesight":1242.9065355838434,"maxSpeed":92.894640842901}
..Sniper
{"acceleration":1927.439569158643,"mass":0.1,"eyesight":248.4096768409083,"maxSpeed":190.1707453508803}
*/