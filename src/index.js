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

var input = document.getElementById('inputItem')
var list = document.getElementById('list')

var categories = []

var selectValue = 'None'

function getDocumentHeight () {
  var body = document.body
  var html = document.documentElement

  return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
}

function createItem (text, done, isHTML = false, category = false) {
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
    ipcRenderer.send('heightChanged', getDocumentHeight())
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
  category ? document.getElementById(category).appendChild(newNode) : list.appendChild(newNode)
}

function createCategory (name) {
  var newListNode = document.createElement('ul')
  var titleNode = document.createElement('strong')
  var titleTextNode = document.createTextNode(name)

  titleNode.appendChild(titleTextNode)
  list.appendChild(titleNode)

  newListNode.setAttribute('id', name)

  list.appendChild(newListNode)

  categories.push(name)

  listCategories()
}

function publishList (data) {
  data.forEach(element => {
    if (element.category) {
      createCategory(element.category)
      element.content.forEach(item => {
        createItem(item.text, item.done, true, element.category)
      })
    } else {
      createItem(element.text, element.done, true)
    }
  })
}

function ListSave () {
  var save = fs.readFileSync(path.join(__dirname, 'save.json'))
  save = JSON.parse(save.toString())
  publishList(save)
  ipcRenderer.send('heightChanged', getDocumentHeight())
}

function SaveList () {
  var data = []

  Array.from(list.children).forEach(element => {
    if (element.localName === 'ul') {
      var category = {}
      category.category = element.id
      category.content = []
      Array.from(element.children).forEach(item => {
        var text = item.querySelector('span:not(.seperator)').innerHTML
        var done = item.querySelector('input[type="checkbox"]').checked
        category.content.push({ 'text': text, 'done': done })
      })
      data.push(category)
    } else if (element.localName === 'li') {
      var text = element.querySelector('span:not(.seperator)').innerHTML
      var done = element.querySelector('input[type="checkbox"]').checked
      data.push({ 'text': text, 'done': done })
    }
  })

  data = JSON.stringify(data)

  fs.writeFileSync(path.join(__dirname, 'save.json'), data, (err) => {
    if (err) throw err
  })
}

function EmptyList () {
  var list = document.getElementById('list')
  list.innerHTML = ''
  ipcRenderer.send('heightChanged', getDocumentHeight())
}

function listCategories () {
  var select = document.querySelector('select')
  var htmlCode
  htmlCode += '<option value="None">None</option>'
  categories.forEach(element => {
    htmlCode += '<option value="' + element + '">' + element + '</option>'
  })
  select.innerHTML = htmlCode
}

document.querySelector('select').addEventListener('change', e => {
  selectValue = e.target.value
})

// If form is submitted
document.getElementById('createItem').addEventListener('submit', e => {
  e.preventDefault()
  EmptyList()

  // List the current save.json
  ListSave()

  // Convert input value to html and add it to the list
  createItem(input.value, false, false, selectValue)

  // Update height
  ipcRenderer.send('heightChanged', getDocumentHeight())

  // Empty input
  input.value = ''

  // Amend the save.json file
  SaveList()
})

document.getElementById('createCategory').addEventListener('submit', e => {
  e.preventDefault()

  var inputValue = document.getElementById('inputCategory').value

  createCategory(inputValue)

  SaveList()
})

ListSave()

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('heightChanged', getDocumentHeight())

  listCategories()
})
