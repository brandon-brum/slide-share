let broadcast = new BroadcastChannel("SlideShareChatr8n3a8t2c")

chatBox.onkeypress = function(e) {
  if (e.key == "Enter" && !e.shiftKey) {
    broadcast.postMessage("$:" + chatBox.innerText)
    chatBox.innerText = ""
    e.preventDefault()
  } 
}

broadcast.onmessage = function(e) {
  if (e.data.charAt(0) == "$") addMessage(e.data.substring(2), true)
}

function addMessage(text, self) {
  let textElem = document.createElement("p")
  let textSpan = document.createElement("span")
  textElem.className = self ? "self" : "peer"
  textSpan.innerText = text
  textElem.append(textSpan)
  if (chatContents.offsetHeight + chatContents.scrollTop == chatContents.scrollHeight) {
    chatContents.append(textElem)
    chatContents.scrollBy(0,9999)
  } else {
    chatContents.append(textElem)
  }
}