chatBox.onkeypress = function(e) {
  if (e.key == "Enter" && !e.shiftKey) {
    if (chatBox.innerText == "") {
      e.preventDefault()
      return
    }
    chatBox.innerText = chatBox.innerText.trim()
    opener.sendMessage(chatBox.innerText)
    opener.showMessage(chatBox.innerText, self)
    chatBox.innerText = ""
    e.preventDefault()
  } 
}

/*broadcast.onmessage = function(e) {
  if (e.data.charAt(0) == "$") addMessage(e.data.substring(2), true)
}*/

function showMessage(text, self) {
  let textElem = document.createElement("p")
  let textSpan = document.createElement("span")
  textElem.className = self ? "self" : "peer"
  textSpan.innerText = text
  textElem.append(textSpan)
  if ((chatContents.offsetHeight + chatContents.scrollTop) - chatContents.scrollHeight < 10) {
    chatContents.append(textElem)
    chatContents.scrollBy(0,9999)
  } else {
    chatContents.append(textElem)
  }
}