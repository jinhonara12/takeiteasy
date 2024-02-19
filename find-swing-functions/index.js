const functions = require('firebase-functions');
const dotenv = require("dotenv");
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set } = require("firebase/database");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { Client } = require("@notionhq/client");
const { PubSub } = require('@google-cloud/pubsub');

dotenv.config({ path: '../.env' })

const firebaseConfig = {
    apiKey: functions.config().takeiteasy.apikey,
    authDomain: functions.config().takeiteasy.authdomain,
    projectId: functions.config().takeiteasy.projectid,
    storageBucket: functions.config().takeiteasy.storagebucket,
    messagingSenderId: functions.config().takeiteasy.messagingsenderid,
    appId: functions.config().takeiteasy.appid,
    measurementId: functions.config().takeiteasy.measurementid
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// init DB
const database = getDatabase(app)

/* 
init AUTH
    노션 데이터 가져오는 함수 실행
*/
const auth = getAuth(app)

// 노션 데이터 가져오는 함수
const NOTION_KEY = functions.config().takeiteasy.notionkey;
const FEST_KEY = functions.config().takeiteasy.notionfestid;
const NOTION = new Client({ auth: NOTION_KEY });

// Pub/Sub 클라이언트를 초기화합니다.
const pubsub = new PubSub();

const getPageProperty = async (id_array, PATH) => {
    const PROPERTY_OBJECT = [];
    for (let i = 0; i < id_array.length; i++) {
        const DATA_TYPE_ARRAY = [];
        const response = await NOTION.pages.retrieve({ page_id: id_array[i].id })
            .then(data => {
                data.properties.type.multi_select.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0).forEach((el) => { DATA_TYPE_ARRAY.push({ 'name': el.name, 'color': el.color }) })

                PROPERTY_OBJECT.push({
                    title: data.properties.name.title[0].plain_text,
                    start_date: data.properties.date.date ? data.properties.date.date.start : '',
                    end_date: data.properties.date.date && data.properties.date.date.end ? '~' + data.properties.date.date.end : '',
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
    // DB에 입력
    set(ref(database, PATH), PROPERTY_OBJECT);
}

const getPgaeID = (result_array, PATH) => {
    const ID_ARRAY = [];
    result_array.forEach((el) => {
        let { id } = el
        ID_ARRAY.push({ id })
    })
    getPageProperty(ID_ARRAY, PATH)
}

const getFestPages = async () => {
    try {
        const response_index = await NOTION.databases.query({
            database_id: FEST_KEY,
            sorts: [{
                property: 'date',
                // direction: 'ascending'
                direction: 'descending',
            }],
            filter: {
                and: [
                    {
                        or: [
                            {
                                property: "type",
                                multi_select: {
                                    contains: "행사"
                                }
                            },
                            {
                                property: "type",
                                multi_select: {
                                    contains: "대회"
                                }
                            }
                        ],
                    },
                    {
                        property: "d_day",
                        formula: {
                            string: {
                                does_not_contain: "종료"
                            }
                        }
                    }
                ]
            }
        });

        const response_class = await NOTION.databases.query({
            database_id: FEST_KEY,
            sorts: [{
                property: 'date',
                // direction: 'ascending'
                direction: 'descending',
            }],
            filter: {
                and: [
                    {
                        or: [
                            {
                                property: "type",
                                multi_select: {
                                    contains: "팀원"
                                }
                            },
                            {
                                property: "type",
                                multi_select: {
                                    contains: "강습"
                                }
                            },
                            {
                                property: "type",
                                multi_select: {
                                    contains: "워크샵"
                                }
                            }
                        ]
                    },
                    {
                        property: "d_day",
                        formula: {
                            string: {
                                does_not_contain: "종료"
                            }
                        }
                    }
                ]
            }
        });

        const response_end = await NOTION.databases.query({
            database_id: FEST_KEY,
            sorts: [{
                property: 'date',
                // direction: 'ascending'
                direction: 'descending',
            }],
            filter: {
                property: "d_day",
                formula: {
                    string: {
                        contains: "종료"
                    }
                }
            }
        });
        getPgaeID(response_index.results, 'notion/index');
        getPgaeID(response_class.results, 'notion/class');
        getPgaeID(response_end.results, 'notion/end');
    } catch (error) {
        console.error('Error : getFestPages함수 내, ', error)
    }

}

exports.scheduledFunction = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    try {
        // Firebase 인증
        const db_id = functions.config().takeiteasy.dbid;
        const db_pw = functions.config().takeiteasy.dbpw;

        await signInWithEmailAndPassword(auth, db_id, db_pw);

        // 노션 데이터 가져오는 함수 실행
        await getFestPages();

        return null;
    } catch (error) {
        console.error('Error: scheduledFunction함수 내, ', error);
        return null;
    }
});