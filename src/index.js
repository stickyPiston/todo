const fs = require('fs')
const path = require('path')
const { ipcRenderer } = require('electron')
const showdown = require('showdown')
var converter = new showdown.Converter({
  simplifiedAutoLink: true,
  excludeTrailingPunctuationFromURLs: true,
  strikethrough: true,
  ghMentions: true
})

var input = document.getElementById('input')
var list = document.getElementById('list')

function createItem (text, done, isHTML) {
  var newNode = document.createElement('li')
  var spanNode = document.createElement('span')
  var checkboxNode = document.createElement('input')
  checkboxNode.setAttribute('type', 'checkbox')
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

  spanNode.innerHTML = isHTML ? text : converter.makeHtml(text)

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
    createItem(element.data, element.done, true)
  })
}

function SaveList () {
  var data = []

  Array.from(document.querySelectorAll('li > span:not(.seperator)')).forEach(element => {
    var done = element.parentElement.style.textDecoration === 'line-through'
    data.push({ 'data': element.innerHTML, 'done': done })
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

// If form is submitted
document.getElementsByTagName('form')[0].addEventListener('submit', e => {
  e.preventDefault()
  EmptyList()

  // List the current save.json
  ListSave()

  // Convert input value to html and add it to the list
  createItem(input.value)

  // Update height
  ipcRenderer.send('heightChanged', document.getElementsByTagName('li').length)

  // Empty input
  input.value = ''

  // Amend the save.json file
  SaveList()
})

ListSave()

ipcRenderer.send('heightChanged', document.getElementsByTagName('li').length)
