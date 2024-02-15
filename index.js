import dotenv from "dotenv"
import { initializeApp } from "firebase/app";
import { getDatabase, set, ref } from "firebase/database"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { getAnalytics } from "firebase/analytics";
import { Client } from "@notionhq/client";
dotenv.config()

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// init DB
const database = getDatabase(app)

/* 
init AUTH
    노션 데이터 가져오는 함수 실행
*/
const auth = getAuth(app)
const db_id = process.env.db_ID;
const db_pw = process.env.db_PW;

signInWithEmailAndPassword(auth, db_id, db_pw)
    .then((userCredential) => {
        const user = userCredential.user;
        console.time('데이터 업로드')
        getFestPages()
    })
    .catch(err => {
        console.log("로그인 에러", err)
    })

// 노션 데이터 가져오는 함수
const NOTION_KEY = process.env.NOTION_KEY;
const FEST_KEY = process.env.NOTION_FEST_ID;
const NOTION = new Client({ auth: NOTION_KEY });

const getPageProperty = async (id_array) => {
    const PROPERTY_OBJECT = [];
    for (let i = 0; i < id_array.length; i++) {
        const DATA_TYPE_ARRAY = [];
        const response = await NOTION.pages.retrieve({ page_id: id_array[i].id })
            .then(data => {
                data.properties.type.multi_select.sort((a, b) => b - a).forEach((el) => { DATA_TYPE_ARRAY.push(el.name) })
                PROPERTY_OBJECT.push({
                    title: data.properties.name.title[0].plain_text,
                    start_date: data.properties.date.date ? data.properties.date.date.start : '',
                    end_date: data.properties.date.date && data.properties.date.date.end ? data.properties.date.date.end : '',
                    d_date: data.properties.d_day.formula.string ? data.properties.d_day.formula.string : "",
                    formpage: data.properties.formpage.url ? data.properties.formpage.url : '',
                    webpage: data.properties.webpage.url ? data.properties.webpage.url : '',
                    checkpage: data.properties.checkpage.url ? data.properties.checkpage.url : '',
                    emoji: data.icon ? data.icon.emoji : '',
                    type: DATA_TYPE_ARRAY,
                    detail: data.properties.detail.rich_text[0] ? data.properties.detail.rich_text[0].plain_text : '',
                })
            })
    }
    set(ref(database, 'notion/fest'), PROPERTY_OBJECT);
    console.timeEnd('데이터 업로드')
}

const getPgaeID = (result_array) => {
    const ID_ARRAY = [];
    result_array.forEach((el) => {
        let { id } = el
        ID_ARRAY.push({ id })
    })
    getPageProperty(ID_ARRAY)
}

const getFestPages = async (req, res) => {
    const response = await NOTION.databases.query({
        database_id: FEST_KEY,
        sorts: [{
            property: 'date',
            direction: 'ascending'
            // direction: 'descending',
        }]
    });
    getPgaeID(response.results);
}
