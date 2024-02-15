fetch("https://takeiteasy-d0bc5-default-rtdb.firebaseio.com/notion/fest.json")
    .then(response => response.json())
    .then(data => {
        console.log(data)
    })