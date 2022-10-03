let gUnits, viewBox, svg, geoMarker, adjacent, uShapes, aShapes, gSelected, p, svgA, gUnitNo, bn, filterRanges, gTrace

const vbHome = window.innerWidth > 600 ? [196, -82, 403, 482] : [130, 95, 300, 424]
const center = [325, 300]
const el = el => document.getElementById(el)
const sidebar = el('sidebar')
const contentAmen = el('contentAmen')
const btnClose = el('btnClose')
const txtLink = el('txtmsg')
const filterGroups = el('filterGroups')
const followMe = el('followMe')
const noMatches = el('noMatches')
const dtours = el('tours')
const status = []
const isMobile = window.screen.width < 400
let selected = []
const fnav = document.querySelector('.fnav')
let cFloor = `all`
const amap = el('amap')
const fSel = [el('selectFloor'), sidebar]
const cflist = [fSel[0], sidebar]
let dc = false
const xmlns = 'http://www.w3.org/2000/svg'
function aeListen (e, h, param) {
  e.addEventListener('click', function () { h(param) })
  return e
}
const sa = (attr, ...el) => (el.forEach(child => { for (key in attr) child.setAttribute(key, attr[key]) }))
const es = item => item.split('_')
const sc = item => item[0].setAttribute('class', item[1])
const slopeR = p => Math.atan((p[1][1] - p[0][1]) / (p[1][0] - p[0][0]))
// cid,dPt,sp,unit//{ floor: 'floor1', color: 'plan' }
// let floorContent = document.querySelector(``) //{}
const ppXY = () => { const { a, b, c, d, e, f } = geoMarker.transform.baseVal.getItem(0).matrix; return [parseFloat(e.toFixed()), parseFloat(f.toFixed())] }
const mDist = (p1, p2) => { let a = p1[0] - p2[0]; let b = p1[1] - p2[1]; return Math.sqrt(a * a + b * b) }
const extPt = (pt, Ang, dist) => [(dist * Math.cos(Ang) + pt[0]), (dist * Math.sin(Ang) + pt[1]) ]
const extLine = (pts, Ang, dist) => pts.map(pt => [(dist * Math.cos(Ang) + pt[0]), (dist * Math.sin(Ang) + pt[1]) ])

const urlSearchParams = new URLSearchParams(window.location.search)
const params = Object.fromEntries(urlSearchParams.entries())
const hasParams = ('u' in params || 'a' in params)
const hasTrace = 'trace' in params
if (hasParams) { Object.keys(params).forEach(k => params[k] = params[k].split('|')) }

const today = Date.now()
const anext = days => new Date().getTime() + (days * 86400000)
let counts = { floor1: 0, floor2: 0, floor3: 0 }
// { floor1: [], floor2: [], floor3: [] }

// sin = opposite/hypotenuse | cos = adjacent/hypotenuse | tan = opposite/adjacent
const elF = (t, attr, ...ch) => {
  const el = document.createElement(t)
  for (key in attr) {
    el.setAttribute(key, attr[key])
  }
  ch.forEach(child => {
    if (typeof child === 'string' || typeof child === 'number') {
      el.innerHTML = child
    } else {
      el.appendChild(child)
    }
  })
  return el
}

function svgE (el, attr) {
  const svgEl = document.createElementNS(xmlns, el)
  for (key in attr) { svgEl.setAttribute(key, attr[key]) }
  return svgEl
}
const svgT = (label, attr) => {
  const svgText = svgE('text', attr)
  svgText.textContent = label
  return svgText
}

// handlePath(es(contentPopUp.childNodes[0].getAttribute('datapath')))
const getData = (path, cb) => fetch(path)
  .then((response) => response.json())
  .then((data) => {
    return cb(data)
  })
// let gridCont = `<div class="gridlabels"><div>Plan</div> <div>Unit</div> <div>Rent</div><div>Sq. Ft.</div> <div> Path</div>`
const getBuffer = element => {
  const { x, y, width, height } = element.getBBox()
  return [(x - 80).toFixed(), (y - 50).toFixed(), (width + 160).toFixed(), (height + 100).toFixed()]
}
let gDoors, gSw, p_paths
window.addEventListener('load', function () {
  svgObject = el('svg1').contentDocument
  svg = svgObject.getElementsByTagName('svg')[0]
  viewBox = svg.viewBox.baseVal
  gUnits = svg.querySelector('g#units')
  geoMarker = svg.querySelector('#geoMarker')
  gSelected = svg.querySelector('g#gSelected')
  svgA = svg.querySelector('g#amenities')
  gUnitNo = svg.querySelector('g#unitNo')
  gTrace = svg.querySelector('g#trace')
  p = svg.createSVGPoint()
  cflist.push(gUnits)
  // gUnitNo.querySelectorAll('text[id*=un_A-]').forEach(txt => (txt.setAttribute('x', parseFloat(txt.getAttribute('x')) + 2)))
  getData('./data/cw_9_23.json', hA)
  makeDraggable()
})

const CTM = () => svg.getScreenCTM()
const svgMT = () => p.matrixTransform(CTM()) // p.matrixTransform(CTM().inverse())

const getBB = element => {
  const { x, y, width, height } = element.getBBox()
  return [x, y, width, height, parseFloat((x + (width / 2)).toFixed()), parseFloat((y + (height / 2)).toFixed())]
}

function hA (data) {
  adjacent = data.adjacent; uShapes = data.units; aShapes = data.amenities; bn = data.bn
  // Object.values(data.units).forEach(unit => gSelected.appendChild(svgE('path', { d: unit.path })))
  // adjacent.sw.forEach((sw, si) => { let line = svgE('line', { id: `sw_${si}`, x1: sw.coords[0][0], y1: sw.coords[0][1], x2: sw.coords[1][0], y2: sw.coords[1][1] }); console.log(line); gTrace.appendChild(line) })
  getData('./data/status_cw_9_23.json', handleUnits)
}
function gli (line1, line2) {
  let dx1 = line1[1][0] - line1[0][0]
  let dy1 = line1[1][1] - line1[0][1]
  let dx2 = line2[1][0] - line2[0][0]
  let dy2 = line2[1][1] - line2[0][1]
  let dx3 = line2[0][0] - line1[0][0]
  let dy3 = line2[0][1] - line1[0][1]

  let cross = dx2 * dy1 - dy2 * dx1
  if (Math.abs(cross) < 1e-8) { return false }

  let s = (dx1 * dy3 - dy1 * dx3) / cross
  if (s >= 0 && s <= 1) {
    let t = dx1 !== 0 ? (dx3 + dx2 * s) / dx1 : (dy3 + dy2 * s) / dy1

    if (t >= 0 && t <= 1) {
      return [line2[0][0] + dx2 * s, line2[0][1] + dy2 * s].map(c => (parseFloat(c.toFixed(2))))
    }
  }
}
function getStartPath (line2, op, d = { swi: false, dist: 1999 }) {
  adjacent.sw.forEach((line1, i) => {
    let cli = gli(line1.coords, line2) // extLine(sp, line1.sR, dv)]
    if (cli) {
      let mL = mDist(cli, line2[2]) + mDist(cli, op)
      if (d.dist > mL) { d = { swi: i, dist: mL, cli: cli, coords: adjacent.sw[i].coords } } // coords: line1.coords
    }
  })
  return d
}
const closerPt = (pt, line) => line.map(l => mDist(pt, l))
// const closerPt = (pt, line) => mDist(pt, line[0]) < mDist(pt, line[1]) ? 0:1
const turnOff = () => dc.forEach(e => e.classList.toggle('on')) // list.forEach(e => console.log(e.classList)/* e.classList.toggle('on') */)
// dc ? [status[dc].unitUI, status[dc].svgU].forEach(e => e.classList.toggle('on')) : null
const oppositePt = (uc, point2) => uc[0] == point2[0][0] && uc[1] == point2[0][1] ? point2[1] : point2[0]

const getPath = (current, dest) => {
  // console.log('current', current)
  // console.log('dest', dest)
  // console.log('start options', adjacent.sw[current.swi])
  current['parent'] = 'start'
  let start = parseFloat(current.swi)
  let closed = {}
  let open = {}
  let gp = false

  function buildPath (path, next) {
    // penultimate coords before unit. add both points in order
    const closeSW = (uc, point2) => uc[0] == point2[0][0] && uc[1] == point2[0][1] ? point2[1] : point2[0]
    // add in door points

    if (next == start) {
      let spi = addDoors(adjacent.doors[closed[next].di].coords, current.uc)
      path.push(spi)
    }
    while (next != 'start') {
      path.push(closed[next].uc)

      if (closed[next].parent == start) {
        path.push(closeSW(closed[next].uc, adjacent.sw[next].coords))
      }
      next = closed[next].parent
    }
    return path
  }

  const updateCurrent = () => {
    // move current to closed
    closed[current.swi] = current
    // remove it from open so it doesn't get checked again
    delete open[current.swi]
    let d = { swi: false, dist: 1500 }
    // all adj lines in open, check the distance
    Object.keys(open).forEach(k => {
      if (open[k].g < d.dist) {
        d = { swi: k, dist: open[k].g }
      }
    })

    // build as far as you can -- change the dest to be current
    if (!d.swi) {
      console.log('stuck!', current, 'looking for', dest.swi, 'open', open, 'closed', closed); return
    }//

    current = open[d.swi]
    getNextPath(adjacent.sw[parseFloat(current.swi)].match)
  }

  const getNextPath = (match/*, layer */) => {
    match.forEach(adj => {
      let al = adjacent.sw[parseFloat(adj.lineIndex)]
      if (adj.lineIndex in closed || adj.lineIndex in open) { return }
      if (adj.lineIndex == dest.swi) {
        let ad = [dest.uc, addDoors(adjacent.doors[dest.di].coords, current.uc)]
        ad.push(current.uc)
        gp = buildPath(/* [current.uc], */
          ad,
          current.parent)
        return
      } // ,dest.uc,
      let ghf = {
        h: mDist(dest.uc, adj.adjStartEnd),
        f: current.f + mDist(al.coords[0], al.coords[1]),
        parent: current.swi,
        swi: `${adj.lineIndex}`,
        uc: adj.adjStartEnd// oppositePt(current.uc, al.coords) //
      }
      ghf['g'] = ghf.h + ghf.f
      open[ghf.swi] = ghf
    })

    return !gp ? updateCurrent() : gp
  }
  // getNextPath(adjacent.sw[parseFloat(current.swi)].match)
  // should be coords of door then match...
  'unit' in current // if coming from unit check breezeway doors otherwise goto sw
    ? current.uc = (current.gli,
    // 'swi', current.swi, 'uc', current.uc, 'current.di', current.di, 'doors', adjacent.doors[parseFloat(current.di)]),
    getNextPath(adjacent.doors[parseFloat(current.di)].match))
    : getNextPath(adjacent.sw[parseFloat(current.swi)].match)
  return gp
}

const closestI = (pts, uc, pk) => { // find closest
  let d = { i: false, dist: 999 }
  pts.forEach((p, i) => {
    if (!p) { console.log(pts) }
    let mL = mDist(uc, p[pk])
    if (mL < d.dist) { d = { i: i, dist: mL } };
  })
  return d.i
}

const addDoors = (cc, uc) => {
  let cp = cc.map(dc => [mDist(dc, uc)])
  let cpi = cp[0] < cp[1] ? 0 : 1
  return cc[cpi]
}

const sortU = (pxy = ppXY()) => {
  gSelected.innerHTML = ''
  let current = {
    uc: pxy
  }
  selected = status.filter(u => u.bP.classList.contains('path'))
  let count = 1
  let tours = []

  let sc = elF('div', { class: 'tour' }, '<h5>Community Tour</h5>')

  while (selected.length > 0) {
    let destI = closestI(selected, current.uc, 'cid')
    let dest = selected[destI]
    let adm = adjacent.doors[dest.di].match // line connecting door to sw
    let admi = adm.length > 1 ? closestI(adm, current.uc, 'adjStartEnd') : 0

    // closerPt(current.uc, [adm[0].adjStartEnd, adm[1].adjStartEnd]) : 0 // if more than one connection, choose line closest to dest
    dest['swi'] = adm[admi].lineIndex // index of door line
    dest['dPt'] = adm[admi].adjStartEnd // door point not connected to door -- needs to be added to hp -- it represents the start point of the path
    let op = oppositePt(dest.dPt, adjacent.sw[dest.swi].coords)

    dest.uc = dest.gli // dest.gli // dest.dPt //should be gli because can take different way out

    if (!(`swi` in current)) {
      Object.assign(current, getStartPath([extPt(current.uc, slopeR([current.uc, dest.dPt]), 150), extPt(current.uc, slopeR([current.uc, dest.dPt]), -150), current.uc], current.uc))
    }
    current['f'] = mDist(current.uc, dest.uc)

    // gDetails.appendChild(svgE('line', { x1: adjacent.doors[dest.di].coords[0][0], y1: adjacent.doors[dest.di].coords[0][1], x2: adjacent.doors[dest.di].coords[1][0], y2: adjacent.doors[dest.di].coords[1][1], stroke: 'yellow' }))
    let hp = current.swi == dest.swi ? adjacent.sw[current.swi].coords : getPath(current, dest)

    if (hp) {
      let gDetails = svgE('g', { dataunit: dest.unit })
      let pl = svgE('path', { datafloor: `floor${dest.floor}`, d: 'M' + hp.join(' ')/* + ' ' + hp.join(' '), */, class: `path_${count}`, dataunit: dest.unit })

      gDetails.appendChild(pl)
      if (dest.floor != 'amenity' && dest.svgU.classList.contains('stacked')) { gDetails.classList.add('stacked') }
      aeListen(gDetails.appendChild(
        svgE('use', { datafloor: `floor${dest.floor}`, href: `#pinPath`, x: dest.cid[0], y: dest.cid[1], dataunit: dest.unit, class: `path_${count}` })), addPath, status[dest.statusI])
      gDetails.appendChild(svgT(count, { x: dest.cid[0], y: dest.cid[1], dataunit: dest.unit, class: `circleTxt path_${count}` }))
      gSelected.appendChild(gDetails)
      current = selected.splice(destI, 1)[0]
      dest.bP.setAttribute(`datacircle`, count)
      sc.appendChild(dest.unitUI) // .setAttribute('style', `order:${count};`)
      dest.svgU.classList.add('tour')

      tours.push({ t: pl, hp: hp, name: `unit` in dest ? `#${dest.unit}` : dest.title, r: dest.bP })
    }
    count++
  }

  sc.appendChild(aeListen(
    elF('button', { id: 'btnShow', class: 'btn' }, 'Take Tour'),
    takeTour, tours))

  svg.setAttribute('viewBox', count == 1 ? `0 0 637.7 407.7` : getBuffer(gSelected).join(' '))
  gUnits.setAttribute('datafloor', 'tour')
  fSel[0].setAttribute('datafloor', 'all')
  sidebar.setAttribute('datafloor', 'all')
  dtours.classList.replace('pending', 'touring')
  dtours.replaceChildren(sc)
  txtTours.innerHTML = 'Follow the orange line to your community destination. The route will be removed when you arrive and your next path will be highlighted.'
  txtLink.classList.toggle('wide')
  if (followMe.classList.contains('track')) { getLocation({ d: tours[0].hp[0], l: tours[0].t.getTotalLength() }) }
}

const mapBtm = (mb = svg.getBoundingClientRect()) => mb.width < 600 ? mb.height : `20`
const addPath = us => (
  [us.unitUI, us.svgU].forEach(e => e.classList.toggle('on')),
  dc ? turnOff(dc) : null,
  cFloor == 'all' && 'stacked' in us && event.target.tagName == 'path'
    ? (contentAmen.classList.add('stacked'), contentAmen.lastElementChild.innerHTML = '<h4>Multiple Units</h4>', us.stacked.forEach(s => contentAmen.lastElementChild.appendChild(status[s].descUI)))
    : (contentAmen.lastElementChild.replaceChildren(us.descUI), contentAmen.classList.remove('stacked')),
  contentAmen.setAttribute('style', `left:10px; top:${mapBtm()}px;`),
  dc = [us.unitUI, us.svgU],
  console.log(us.bP, us.bP.attributes),
  us.bP.hasAttribute('datacircle') ? (gSelected.querySelector(`g[dataunit=${us.unit}] path`).classList.add('on'), dc.push(gSelected.querySelector(`g[dataunit=${us.unit}] path`))) : moveMap(bn[`bldg_${us.building}`])/*,
  document.getElementById('containerPopUp').scrollTo(0, contentPopUp.querySelector('.on').getBoundingClientRect().y) */
)

const svgDomHover = (items, value) => items.forEach(item =>
  ['mouseenter', 'mouseleave'].forEach(me => item.addEventListener(me, function () {
    items.forEach(item => item.classList.toggle(value))
  })
  ))

const updateFloorCounts = (all = 0) => (Object.keys(counts).forEach(fl => (
  fSel[0].querySelector(`li[datafloor=${fl}]`).lastChild.textContent = counts[fl],
  all += counts[fl])),
fSel[0].querySelector(`li[datafloor=all`).lastChild.textContent = all)

const restoreMembers = (members) => members.forEach(member => (
  status[member].unitUI.classList.remove('off'),
  status[member].svgU.classList.remove('off'),
  counts[`floor${status[member].floor}`]++
))

const removeMembers = (members) => {
  members.forEach(member => {
    if (!status[member].unitUI.classList.contains('off')) {
      status[member].unitUI.classList.add('off')
      status[member].svgU.classList.add('off')
      counts[`floor${status[member].floor}`]--
    }
  }
  )
}

const handleFilter = g => {
  g.fg.selected == g.fgri
    ? restoreMembers(g.fg.ranges[g.fgri].members)
    : g.fg.ranges.forEach((fr, fri) => {
      if (g.fgri != fri && 'members' in fr) {
        g.fgri == 0 ? restoreMembers(fr.members) : removeMembers(fr.members)
      }
    })
  g.fg.selected = g.fgri
  g.fg.ui.label.textContent = g.fg.ranges[g.fgri].label
  updateFloorCounts()
}

const ni = (v, imgs = contentAmen.querySelectorAll('img'), next) => {
  imgs.forEach((img, i) => {
    if (img.classList.contains('on')) {
      next = i + v
      img.classList.replace('on', 'off')
    }
    if (next < 0) { next = imgs.length - 1 }
    if (next == imgs.length) { next = 0 }
  })
  imgs[next].classList.replace('off', 'on')
}

const galleryA = [{ cl: 'gprev', v: -1, t: '<' }, { cl: 'gnext', v: 1, t: '>' }].map((c) => aeListen(elF('a', { class: c.cl }, c.t), ni, c.v))

const imgUI = (title, img) => typeof (img) === 'object'
  ? elF('div', { class: 'gallery' }, img.map((slide, i) => `<img class=${i > 0 ? 'off' : 'on'} alt=${title} src=${'./images/' + slide} />`).join(' '),
    galleryA[0], galleryA[1])
  : elF('div', { class: 'pImg' }, `<img alt=${title} src=${'./images/' + img} />`)

const handleAmenities = function (data) {
  data.forEach(t => {
    let aSvg = svgA.appendChild(svgE('use', { id: `a_${t.sId}`, href: `#icon${t.sId}`, x: aShapes[`a_${t.sId}`].cid[0], y: aShapes[`a_${t.sId}`].cid[1] }))
    let bP = aeListen(elF('div', { 'class': 'a' in params && params.a.indexOf(t.sId) >= 0 ? 'btnPath path' : 'btnPath' }, ''), ap, status.length)
    let unitUI = elF('div', { class: 'amenity' }, t.title,
      'img' in t ? imgUI(t.title, t.img) : '',
      elF('div', { class: 'desc' }, t.content.join(' ')),
      bP
    )
    status.push({ floor: 'amenity', cid: aShapes[`a_${t.sId}`].cid, bP: bP, di: aShapes[`a_${t.sId}`].dPt, statusI: status.length, title: t.title, unitUI: unitUI, svgU: aSvg })
    aSvg.addEventListener('click', (evt) => {
      contentAmen.lastElementChild.replaceChildren(unitUI)
      contentAmen.setAttribute('style', `left:${evt.clientX + 25}px; top:${evt.clientY}px`)
    })
  })
}

const postForm = (p) => {
  fetch(`../db/${p.path}.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(p.details)
  }).then(response => response.text()).then(result => {
    console.log(result)
    if (p.path == 'postCwood') {
      cTrace = false
      unitMarkers = []
    }
    p.reply.textContent = 'Thanks for your feedback.'
  })
}

const formResponse = el('formResponse')
const formStars = formResponse.querySelectorAll(`.icon-star`).forEach(star => star.addEventListener('click', function () { star.classList.toggle('checked') }))
el('btnRequest').addEventListener('click', function (e) {
  e.preventDefault()
  let details = {
    stars: formResponse.querySelectorAll(`.checked`).length,
    comments: formResponse.querySelector(`input`).value
  }
  postForm({ path: 'postCwood', details: details, reply: formResponse })
})
contentAmen.appendChild(formResponse)

const txtTour = el('txtTours')
const btnTour = el('btnTour')
btnTour.addEventListener('click', function () { sortU() })

const reUnit = (r, us) => {
  sidebar.querySelector(`div[dataname=${us.plan}]`).appendChild(us.unitUI)
  if (r) {
    us.bP.removeAttribute('datacircle')
    us.svgU.classList.remove('tour')
    gSelected.removeChild(gSelected.children.item(r - 1))
  }
  let total = dtours.querySelectorAll('div[datacircle]')
  if (total.length == 0) {
    dtours.querySelector('div.unit-row') == null ? (dtours.classList = '', dtours.removeChild(tours.lastChild), fSel[0].querySelector('li[datafloor="all"]').click(), txtTours.innerHTML = `Click <div class="btnPath inline"></div> to add units you would like to tour.`, contentAmen.appendChild(formResponse), contentAmen.setAttribute('style', `left:25px; top:25px`))
      : dtours.classList = 'pending'
    txtmsg.classList.toggle('wide')

    return
  }
  if (r != total.length + 1 && r != 1) { sortU(); return }
  if (r == 1) {
    gSelected.querySelectorAll('g').forEach((g, i) =>
      (
        g.firstChild.setAttribute('class', `path_${i + 1}`),
        g.lastChild.textContent = (i + 1),
        total.item(i).setAttribute('datacircle', i + 1)
      )
    )
  }
}

const ap = i => (
  status[i].bP.classList.toggle('path'),
  status[i].bP.classList.contains('path') ? (dtours.appendChild(status[i].unitUI), dtours.classList.add('pending'), txtTours.innerHTML = `Add more units or click the button above to view tour paths. Click  <div class="btnPath inline"></div> to remove a unit from the tour list.`)
    : status[i].bP.hasAttribute('datacircle') ? reUnit(status[i].bP.getAttribute('datacircle'), status[i]) : reUnit(false, status[i])
)

// dtours.querySelectorAll(`.unit-row`)

btnClose.addEventListener('click', function () {
  event.target.parentElement.setAttribute('style', `top:-500px; left:-500px`)
  moveMap(floorBounds(cFloor))
  dc ? (turnOff(dc), dc = false) : null
})
//
const handleStacked = (list, hf) => {
  list.forEach((v, i) =>
    (
      status[v]['stacked'] = list,
      i == parseFloat(hf)
        ? (status[v].svgU.addEventListener('mouseenter', function () {
          status[v].svgU.classList.add('selected')
          cFloor == 'all' ? list.forEach(l => status[l].unitUI.classList.add('selected'))
            : status[v].unitUI.classList.add('selected')
        }),
        [status[v].svgU, status[v].unitUI].forEach(e => e.addEventListener('mouseleave', function () {
          cFloor == 'all' ? list.forEach(l => status[l].unitUI.classList.remove('selected'))
            : [status[v].svgU, status[v].unitUI].forEach(el => el.classList.remove('selected'))
        })),
        status[v].unitUI.addEventListener('mouseenter', function () {
          [status[v].svgU, status[v].unitUI].forEach(e => e.classList.toggle('selected'))
        }),
        status[v].svgU.classList.add('stacked')
        )
        : (status[v].svgU.addEventListener('mouseenter', function () {
          [status[v].svgU, status[v].unitUI].forEach(e => e.classList.add('selected'))
        }),
        status[v].unitUI.addEventListener('mouseenter', function () {
          cFloor == 'all'
            ? [status[hf].svgU, status[v].unitUI].forEach(e => e.classList.add('selected'))
            : [status[v].svgU, status[v].unitUI].forEach(e => e.classList.add('selected'))
        })),
      [status[v].svgU, status[v].unitUI].forEach(e => e.addEventListener('mouseleave', function () {
        [status[v].svgU, status[v].unitUI].forEach(el => el.classList.remove('selected'))
      }))
    )
  )
}

const handleUnits = (data) => {
  const dataPlans = {}; data.plans.map(p => dataPlans[p.name] = { ui: elF('div', { dataname: p.name }, `<h5>${p.name} | ${p.beds} beds | ${p.bath} Ba| ${p.sf} SF</h5>`), members: { floor1: [], floor2: [], floor3: [] } })

  let allActive = {}
  filterRanges = data.filterRanges.map((fg) => {
    fg['ui'] = {
      label: elF('label', { class: 'filterLabel' }, fg.ranges[fg.selected].label),
      btn: `<button><span>${fg.label}</span></button>`,
      ul: document.createElement(`ul`)
    }
    fg['frr'] = fg.ranges.map((fgr, fgri) => (
      aeListen(fg.ui.ul.appendChild(elF('li', { class: 'filterItem' }, fgr.label)), handleFilter, { fg: fg, fgri: fgri }),
      fg.datafilter === `avail` ? anext(fgr.values) : fgr.values)
    )

    filterGroups.appendChild(
      elF('div', { class: 'column filter', datafilter: fg.datafilter },
        elF('div', { class: 'relative' }, `<button class="filter">${fg.label}<i class="arrow "></i></button>`, fg.ui.label, fg.ui.ul)
      ))
    return fg
  })

  return new Promise(function (resolve) {
    const gc = gUnits.querySelectorAll('g')

    data.status.forEach((us, i) => {
      let tunit = us.floor == '1' ? us.unit : us.unit.replace(`-${us.floor}`, `-${(parseFloat(us.unit[2]) - parseFloat(us.floor) + 1)}`)
      let svgp = uShapes['unit_' + tunit]

      if (!svgp) { console.log('missing', us.unit) }
      if (svgp) {
        us.avail = new Date(us.avail).getTime() /* = new Date(us.avail).getTime()(us['availT'] , */
        us['bP'] = aeListen(elF('div', { class: 'u' in params && params.u.indexOf(us.unit.toString()) >= 0 ? 'btnPath path' : 'btnPath' }, ''), ap, i),
        us['planI'] = Object.keys(dataPlans).indexOf(us.plan)
        us['beds'] = data.plans[us.planI].beds,
        us = Object.assign(us, {
          svgU: gc[us.floor - 1].appendChild(
            svgE('path', { id: `path_${us.unit}`, 'class': `avail${us.floor}`, d: svgp.path })
          ),
          di: svgp.dPt,
          cid: svgp.cid,
          gli: svgp.gli,
          descUI: elF('div', { class: 'unit' },
            `<div class="title">${us.plan} | #${us.unit}</div><img src="images/ctnw/${us.plan}.jpg"/><div class="ugrid"><div><strong>Floor: </strong> ${us.floor}</div> <div><strong>Rent: </strong> ${us.rent}</div><div><strong>Beds: </strong> ${us.beds}</div><div><strong>Baths: </strong> ${data.plans[us.planI].bath}</div> <div><strong>Sq. Ft.: </strong>${us.sf}</div> <div class='full'><strong>Available: </strong>${us.availT}</div>${'amenities' in us ? '<div class="full"><strong>Amenities: </strong>' + us.amenities + '</div>' : ''}`),

          unitUI: elF('div', { class: 'unit-row', datafloor: us.floor, dataunit: i }, us.bP, aeListen(elF('div', { class: 'ubtn' }, `${['unit', 'rent', 'availT', 'floor'].map((k) => `<div class=${k}> ${us[k]}</div>`).join(' ')}`), addPath, us))

        })
        filterRanges.forEach(cat => cat.ranges[cat.frr.findIndex(r => r >= us[cat.datafilter])].members.push(i)
        )
        dataPlans[us.plan].ui.appendChild(us.unitUI)
        gc[us.floor - 1].appendChild(gUnitNo.querySelector(`text#un_${us.unit}`))// move unit number to gUnits.floor
        aeListen(us.svgU, addPath, us),

        us.unitUI.appendChild(us.bP),
        counts['floor' + us.floor]++
        dataPlans[us.plan].members[`floor${us.floor}`].push(i)
        status.push(us)
        // tunit in allActive ? (allActive[tunit].statusI.push(i), allActive[tunit].hf.push(us.floor) /* us.floor>allActive[tunit].hf ? allActive[tunit].hf=us.floor */ /*, handleStacked(allActive[tunit]) */) : allActive[tunit] = { statusI: [i], hf: [us.floor] }
      }
    })

    Object.values(dataPlans).forEach(plan => (
      plan.ui.setAttribute(`counts`, Object.entries(plan.members).map(([k, v]) => `${k}_${v.length}`).join(' ')),
      sidebar.appendChild(plan.ui)
    ))

    /* if (!isMobile) {
      Object.values(allActive).forEach(v => v.statusI.length == 1
        ? svgDomHover([status[v.statusI[0]].unitUI, status[v.statusI[0]].svgU], 'selected')
        : handleStacked(v.statusI, v.hf.indexOf(Math.max(...v.hf).toString())))
    }
*/
    // handleAmenities(data.amenities)
    // if ('u' in params || 'a' in params) { sortU() }
    floorSel()
  })
}

const unoOff = () => (viewBox.width < 300 ? gUnitNo.classList.remove('off') : gUnitNo.classList.add('off'))
const amapStyle = c => svg.setAttribute('style', `top: ${0 + c.f}px; left: ${c.e}px; transform: scale(${1});`)
function moveMap (nVB) {
  if (nVB[2] < 199) { nVB = [nVB[0] - 100, nVB[1] - 10, 200, (parseFloat(nVB[3]) + 50)] }
  var span = 20
  function step () {
    svg.setAttribute('viewBox', [
      viewBox.x + ((nVB[0] - viewBox.x) / span),
      viewBox.y + ((nVB[1] - viewBox.y) / span),
      viewBox.width + ((nVB[2] - viewBox.width) / span),
      viewBox.height + ((nVB[3] - viewBox.height) / span)].join(' '))
    span--
    span > 0 ? window.requestAnimationFrame(step) : unoOff()
  }
  window.requestAnimationFrame(step)
}

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function animate (t, hp) {
  let a = t.getTotalLength()
  // console.log('total length',a, t.getPointAtLength(a).x, viewBox.width / 2, t.getPointAtLength(a).x - (viewBox.width / 2))

  let past = { x: viewBox.x, y: viewBox.y }
  // { x: t.getPointAtLength(a).x - (viewBox.width / 2), y: t.getPointAtLength(a).y - (viewBox.width / 2) }
  return new Promise(function (resolve) {
    function i () {
      if (a > 1) {
        let pos = t.getPointAtLength(a)
        geoMarker.setAttribute('transform', `translate(${pos.x} ${pos.y})`)
        if (viewBox.x == past.x) { /* console.log(pos.y, viewBox.height, 'y offset', (viewBox.height / 2)); return */
          viewBox.x = pos.x - (viewBox.width / 2) //* zf
          viewBox.y = pos.y - (viewBox.height / 2) //* zf
          past = { x: viewBox.x, y: viewBox.y }
        }
        a -= 1

        window.requestAnimationFrame(i)
      } else { resolve() }
    }
    window.requestAnimationFrame(i)
  })
}

const takeTour = async (tours) => {
  for (let index = 0; index < tours.length; index++) {
    await animate(tours[index].t, tours[index].hp)
    await sleep(2000)
    geoMarker.setAttribute('transform', `translate(322 172)`)
    tours[index].r.click()
  }
  dtours.classList.toggle('moving')
  moveMap(floorBounds(cFloor))
}

const floorBounds = (floor, fB) => (fB = floor == 'all' ? gUnits.getBBox() : gUnits.querySelector(`g#${floor}`).getBBox(), [fB.x - 0, fB.y - 0, fB.width + 10, fB.height + 10])

const handleFloor = (fl) => (
  cFloor = fl,
  cflist.forEach((item) =>
    item.setAttribute('datafloor', fl)),
  btnClose.click()
)

const floorSel = async (all = 0) => {
  await handleUnits
  let li, fb
  Object.keys(counts).forEach((fl) => (
    li = fSel[0].querySelector(`li[datafloor=${fl}]`),
    li.addEventListener('click', function () { handleFloor(fl) }),
    li.lastChild.textContent = counts[fl],
    all += counts[fl]
  ))

  fSel[0].appendChild(
    aeListen(
      elF('li', { datafloor: 'all' }, `<div>All</div><div>${all}</div>`),
      handleFloor, 'all'
    )
  )
  fSel[0].lastChild.click()
}

const clearAll = () => (svg.setAttribute('viewBox', '20 0 639.45 372.75'),
gUnitNo.classList.remove('off'), handleFloor('all'), status.forEach(u => { if (u.bP.classList.contains('datacircle')) { u.bP.click() } }))
/* dtours.querySelectorAll(`.unit-row`).forEach(u => retUnit(status[u.getAttribute('datasi')])) */
function handleZoom () {
  let zf = event.target.id == 'zoomInBtn' ? 1.2 : 0.833
  svg.setAttribute('viewBox', [
    viewBox.x + (viewBox.width / 2) * (1 - 1 / zf),
    viewBox.y + (viewBox.height / 2) * (1 - 1 / zf),
    viewBox.width / zf,
    viewBox.height / zf
  ].join(' '))
  // viewBox.width < 400 ? gUnitNo.classList.remove('off') : gUnitNo.classList.add('off')
}
['zoomInBtn', 'zoomOutBtn'].forEach(e => el(e).onclick = handleZoom)
el('refresh').onclick = clearAll
el('filterDropDown').onclick = () => event.target.parentElement.classList.toggle('open')
function makeDraggable (evt) {
  var ael = [
    [startDrag, ['mousedown', 'touchstart']],
    [drag, ['mousemove', 'touchmove']],
    [endDrag, ['mouseup', 'mouseleave', 'touchend', 'touchleave', 'touchcancel' ]]
  ]
  ael.forEach(ae => ae[1].forEach(aet => svg.addEventListener(aet, ae[0])))

  var offset, isDrag, target, transform, start
  function getMousePosition (evt) {
    let c = CTM()
    if (evt.touches) { evt = evt.touches[0] }
    return {
      x: (evt.clientX - c.e) / c.a,
      y: (evt.clientY - c.f) / c.d
    }
  }

  function startDrag (evt) {
    evt.path[1].id === 'geoMarker'
      ? (target = geoMarker, transform = geoMarker.transform.baseVal.getItem(0).matrix)
      : target = viewBox
    offset = getMousePosition(event)
    isDrag = true
  }

  function drag (evt) {
    evt.preventDefault()
    if (!isDrag) { return }
    var coord = getMousePosition(event)
    if (target.id === 'geoMarker') {
      transform.e = coord.x// (start.x += (coord.x - offset.x))
      transform.f = coord.y // (start.y += (coord.y - offset.y))
      return
    }
    target.x -= coord.x - offset.x
    target.y -= coord.y - offset.y
  }

  function endDrag (evt) {
    isDrag = false
  //  amapStyle(CTM())
  }
}
const vbXY = pos => (viewBox.x = pos.x - (viewBox.width / 2), viewBox.y = pos.y - (viewBox.height / 2))
const getSel = (y, p) => {
  if (y != null) {
    p = gSelected.querySelector('use')
    return { d: [parseFloat(p.getAttribute('x')), parseFloat(p.getAttribute('y'))], l: gSelected.querySelector(`path`).getTotalLength() }
  }
  dtours.replaceChildren(elF('div', { class: 'amenity' }, 'Recommended Amenity Tours.'))
  return false
}

const pathTrace = [200, 200]
const pathLL = []

const unitMarkers = []
let cTrace = false
const addUMarker = (m) => {
  m = pathLL.length - 1; gTrace.appendChild(svgE('circle', { cx: m.cx, cy: m.cy, id: el('markerLabel').value }))
  unitMarkers.push({ cx: m.cx, cy: m.cy, id: el('markerLabel').value })
}

const handleTrace = (pos) => {
  pathTrace.push(pos)
  if (cTrace == false) {
    cTrace = gTrace.appendChild(svgE('polyline', { points: pathTrace }))
    sidebar.appendChild(elF('input', { id: 'markerLabel', type: 'text', name: 'unitCircle', placeholder: 'Enter Unit Name' }))
    aeListen(
      sidebar.appendChild(elF('button', { class: 'btn' }, `add marker`)), addUMarker, ''/* { cx: pos[0], cy: pos[1] } */)
    aeListen(
      sidebar.appendChild(elF('button', { class: 'btn' }, `save paths`)), postForm, { path: 'pathsCwood', details: { paths: pathTrace, markers: unitMarkers }, reply: txtTour.textContent })
  }
  txtTour.textContent = `pathTrace ${pathTrace}`
  cTrace.setAttribute('points', pathTrace)
}

function getLocation (dest) {
  const options = {
    enableHighAccuracy: true,
    maximumAge: 90000,
    timeout: 999000
  }
  let wId = navigator.geolocation.watchPosition(showPosition, error, options)
  // let past = { x: 228, y: 122 }
  if (followMe.classList.contains('track') == false) { navigator.geolocation.clearWatch(wId) }
  // svg.setAttribute('viewBox', `228 122 266 114`)

  function error (err) {
    err.code == 1 ? alert(`Please goto Settings->Privacy->LocationServices and give permission for your browser.<br>
If you previously declined location request for this site, you may need to add it back in: click the three dots in the top right corner, click (i) icon then update your location settings.
      `)
      : alert('Sorry, no position available.')
  }

  function showPosition (position) {
    var mapMin = [111.865291, 40.66972]
    let pos = [(((position.coords.longitude + mapMin[0]) * 150000)), ((position.coords.latitude - mapMin[1]) * -150000) ]
    txtTour.textContent = `pathTrace ${pathTrace}`
    pathLL.push(position.coords)
    handleTrace(pos)
    const isInside = (Math.abs(pos[0]) < 1000 && Math.abs(pos[1]) < 1000)
    if (!isInside) {
      txtTour.innerText = `You're outside of the community.`
      if (dest == false) {
        navigator.geolocation.clearWatch(watchId)
        geoMarker.setAttribute('transform', `translate(322,175)`)
        followMe.classList.remove('track')
        return
      }
      let dist = mDist(dest.d, pos)

      viewBox.x = dest.d[0] - (viewBox.width / 2)
      viewBox.y = dest.d[1] - (viewBox.height / 2)
      dtours.querySelector('[datacircle]').click()
      dest = getSel(gSelected.querySelector(`use`))
    }
    if (isInside) {
      geoMarker.setAttribute('transform', `translate(${(((position.coords.longitude + mapMin[0]) * 150000))},${((position.coords.latitude - mapMin[1]) * -150000)}  )`)

      if (dest) {
        let dist = mDist(dest.d, pos)
        Math.abs(dist) < 10 ? (txtTour.innerText = `You arrived! This path will be removed.`, dtours.querySelector('[datacircle]').click(), dest = getSel(gSelected.querySelector(`use`)))
          : txtTour.innerText = `You're ${Math.floor(dist)}px away.`
      }
      viewBox.x = pos[0] - (viewBox.width / 2)
      viewBox.y = pos[1] - (viewBox.height / 2)
    }
  }
}
followMe.addEventListener('click', function () {
  // let dest = gSelected.querySelector(`use`) == null ? false : getSel(gSelected.querySelector(`use`), gSelected.querySelector(`path`))
  followMe.classList.contains('track')
    ? followMe.classList.remove('track')
    : followMe.classList.add('track'), getLocation(getSel(gSelected.querySelector(`use`)))
})
