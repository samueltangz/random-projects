// p5.js render functions
function setup () {
  setupEvo()
  createCanvas(CONFIG.WIDTH, CONFIG.HEIGHT)
  frameRate(CONFIG.FRAMERATE)
}

function draw () {
  // clear() // DEBUG
  iterateEvo()

  fill(255, 255, 255, 255) // 20)
  rect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT)

  entities.forEach(entity => entity.draw())
  // draws the border
  noFill()
  stroke(0, 0, 0)
  strokeWeight(4)
  rect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT)

  // debug...
  let selectedEntityObj = entities.find(entity => entity.uuid === selectedEntity)
  let selectedChildren = []
  let selectedParents = []
  if (selectedEntityObj) {
    // link offsprings
    selectedChildren = entities.filter(entity => entity.type === ENTITY_TYPE.PEOPLE && entity.parents.includes(selectedEntityObj.uuid))
    selectedChildren.forEach(child => {
      stroke(...selectedEntityObj.color())
      strokeWeight(1)
      line(selectedEntityObj.pos.x, selectedEntityObj.pos.y, child.pos.x, child.pos.y)
    })

    // link parent
    selectedParents = entities.filter(entity => entity.type === ENTITY_TYPE.PEOPLE && selectedEntityObj.parents.includes(entity.uuid))
    selectedParents.forEach(parent => {
      stroke(...parent.color())
      strokeWeight(1)
      line(selectedEntityObj.pos.x, selectedEntityObj.pos.y, parent.pos.x, parent.pos.y)
    })
  }


  let res = '<table style="border: 1px #000 solid;"><tr><th>UUID</th><th>Gen</th><th>Energy</th><th>Speed</th><th>Acceleration</th><th>Mass</th><th>Breed thres</th><th>Eyesight</th><th>Offsprings</th><th>Status</th></tr>'
  entities.filter(entity => entity.type === ENTITY_TYPE.PEOPLE).forEach((entity, ind) => {
    res += `
    <tr style="background-color:${tableBackgroundColor(entity.uuid, selectedEntity, selectedParents.map(entity => entity.uuid), selectedChildren.map(entity => entity.uuid), ind)}" onmouseover="selectedEntity = '${entity.uuid}'">
      <td><font style="color:rgb(${entity.color()[0].toFixed(0)}, ${entity.color()[1].toFixed(0)}, ${entity.color()[2].toFixed(0)})">■</font> ${entity.uuid}</td>
      <td>${entity.generation ? `${entity.generation} - ${entity.parents}` : 0}</td>
      <td style="text-align: right;">${parseFloat(entity.energy.toPrecision(5)).toFixed(0)}</td>
      <td style="text-align: right;">${Math.sqrt(Math.pow(entity.velocity.x, 2) + Math.pow(entity.velocity.y, 2)).toFixed(0)} / ${entity.maxSpeed.toFixed(0)}</td>
      <td style="text-align: right;">${entity.acceleration.toFixed(0)}</td>
      <td style="text-align: right;">${entity.mass.toFixed(5)}</td>
      <td style="text-align: right;">${entity.breedThreshold.toFixed(0)}</td>
      <td style="text-align: right;">${entity.eyesight.toFixed(0)}</td>
      <td style="text-align: right;">${entity.offsprings}</td>
      <td style="text-align: right;"">${entity.isBreedable() ? '<font color=red>♥</font>' : `${(entity.energy / entity.breedThreshold * 100).toFixed(0)}% ♥`}</td>
    </tr>`
  })
  res += '</table>'
  document.getElementById('table').innerHTML = res
}

function tableBackgroundColor (cur, entity, parents, children, ind) {
  if (cur === entity) return '#999'
  if (parents.includes(cur)) return '#bbb'
  if (children.includes(cur)) return '#ccc'
  return (ind % 2 == 0) ? '#eee' : '#fff'

}

// debug...
let selectedEntity = ''