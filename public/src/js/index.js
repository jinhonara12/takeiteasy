// db에서 JSON데이터 가져오는 함수
const getJson = () => {
    fetch("https://takeiteasy-d0bc5-default-rtdb.firebaseio.com/notion/fest.json")
        .then(response => response.json())
        .then(data => {
            const ITEM = document.querySelector('.item');
            cloneEl(data.length, ITEM)
            writeDate(data)
            console.timeEnd('getJson')
        })
}
// 데이터 배열 갯수만큼 요소 복사하는 함수
const cloneEl = (count, el) => {
    for (let i = 1; i < count; i++) {
        el.after(el.cloneNode(true))
    }
}

// 복사된 요소(ITEM)에 data 삽입하기
const writeDate = (data) => {
    const d_date = document.querySelectorAll('.dday');
    const title = document.querySelectorAll('.title h3');
    const type = document.querySelectorAll('.type');
    const start_date = document.querySelectorAll('.start_date');
    const end_date = document.querySelectorAll('.end_date');
    const detail = document.querySelectorAll('.detail span');
    const formpage = document.querySelectorAll('.formpage');
    const checkpage = document.querySelectorAll('.checkpage');
    const webpage = document.querySelectorAll('.webpage');
    const el = [d_date, title, type, start_date, end_date, detail, formpage, checkpage, webpage];


    for (let i = 0; i < data.length; i++) {
        el.forEach((el, index) => {
            if (data[i][el[i].dataset.key] != "") {
                if (el[i].dataset.key == "formpage" || el[i].dataset.key == "webpage" || el[i].dataset.key == "checkpage") {
                    el[i].setAttribute('href', data[i][el[i].dataset.key])
                }
                else if (el[i].dataset.key == "type") {
                    const typeSpan = document.querySelector('.type span');
                    cloneEl(data[i].type.length, typeSpan)
                    for (let j = 0; j < type[i].childElementCount; j++) {
                        el[i].querySelectorAll('span')[j].textContent = data[i][el[i].dataset.key][j]
                    }
                }
                else {
                    el[i].textContent = data[i][el[i].dataset.key]
                }
            } else {
                el[i].classList.add('hide')
            }
        })
    }
}


console.time('getJson')
getJson()