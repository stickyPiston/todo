const fs = require('fs')
const path = require('path')
const { ipcRenderer } = require('electron')

var input = document.getElementById('input')
var list = document.getElementById('list')

function createItem (text, done) {
  var newNode = document.createElement('li')
  var spanNode = document.createElement('span')
  var checkboxNode = document.createElement('input')
  checkboxNode.setAttribute('type', 'checkbox')
  var textNode = document.createTextNode(text)
  var separator = document.createElement('span')
  var separatorTextNode = document.createTextNode(' ')

  separator.appendChild(separatorTextNode)
  separator.setAttribute('class', 'seperator')

  var deleteBtn = document.createElement('button')
  var deleteText = document.createTextNode('Delete')
  deleteBtn.setAttribute('class', 'delete')
  deleteBtn.appendChild(deleteText)

  deleteBtn.addEventListener('click', e => {
    e.target.parentElement.parentElement.removeChild(e.target.parentElement)
    ipcRenderer.send('heightChanged', document.getElementsByTagName('li').length)
    SaveList()
  })

  spanNode.appendChild(textNode)

  checkboxNode.setAttribute('title', 'Check this to mark an item as done')
  checkboxNode.addEventListener('click', e => {
    if (!e.target.checked) e.target.parentElement.style.textDecoration = 'none'
    else e.target.parentElement.style.textDecoration = 'line-through'

    SaveList()
  })

  checkboxNode.checked = done
  newNode.appendChild(checkboxNode)
  newNode.appendChild(spanNode)
  newNode.appendChild(separator)
  newNode.appendChild(deleteBtn)
  newNode.style.textDecoration = done ? 'line-through' : 'none'
  list.appendChild(newNode)
}

function ListSave () {
  var save = fs.readFileSync(path.join(__dirname, 'save.json'))
  save = JSON.parse(save.toString())
  save.forEach(element => {
    createItem(element.data, element.done)
  })
}

function SaveList () {
  var data = []

  Array.from(document.querySelectorAll('li > span:not(.seperator)')).forEach(element => {
    var done = element.parentElement.style.textDecoration === 'line-through'
    data.push({ 'data': element.innerText, 'done': done })
  })

  data = JSON.stringify(data)

  fs.writeFileSync(path.join(__dirname, 'save.json'), data, (err) => {
    if (err) throw err
  })
}

function EmptyList () {
  var list = document.getElementById('list')

  list.innerHTML = ''
}

document.getElementsByTagName('form')[0].addEventListener('submit', e => {
  e.preventDefault()
  EmptyList()

  // Amend the save.json file as well.
  ListSave()

  createItem(input.value)

  ipcRenderer.send('heightChanged', document.getElementsByTagName('li').length)

  input.value = ''

  SaveList()
})

ListSave()

ipcRenderer.send('heightChanged', document.getElementsByTagName('li').length)

ipcRenderer.on('updateReady', function (event, text) {
  // changes the text of the button
  var container = document.getElementById('ready')
  container.disabled = false
  container.innerHTML = 'new version ready!'
})
