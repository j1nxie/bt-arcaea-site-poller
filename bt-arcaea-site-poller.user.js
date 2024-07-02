/// <reference path="./arcaea.d.ts">
// ==UserScript==
// @name     bt-arcaea-site-poller
// @version  1.0.0
// @grant    GM.xmlHttpRequest
// @connect  bokutachi.xyz
// @connect  webapi.lowiro.com
// @author   j1nxie
// @match    https://arcaea.lowiro.com/en/profile/*
// @require  https://cdn.jsdelivr.net/npm/@trim21/gm-fetch
// @run-at   document-idle
// ==/UserScript==

console.log("BTIMPORT");

const BT_SELECTED_CONFIG = /** @type {const} */("nazunacord");
const BT_CONFIGS = /** @type {const} */({
    "nazunacord": {
        baseUrl: "https://tachi.beerpsi.cc",
        clientId: "CI76714ce710c0a8f391154782c1dd2b3e6325a5be",
    }
});
const BT_BASE_URL = BT_CONFIGS[BT_SELECTED_CONFIG].baseUrl;
const BT_CLIENT_ID = BT_CONFIGS[BT_SELECTED_CONFIG].clientId;
const API_KEY = "api-key";
const DIFFICULTIES = /** @type {const} */(["Past", "Present", "Future", "Beyond", "Eternal"]);
const LAMPS = /** @type {const} */(["LOST", "CLEAR", "FULL RECALL", "PURE MEMORY", "EASY CLEAR", "HARD CLEAR"]);
let latestScoreTimestamp = Date.now();
let polling = false;

if (typeof GM_fetch !== "undefined") {
    fetch = GM_fetch
}

/**
 * @param {string} key
 * @returns {string | null}
 */
function getPreference(key) {
    return localStorage.getItem(`__btimport__${key}_${BT_SELECTED_CONFIG}`)
}

/**
 * @param {string} key
 * @param {any} value
 * @returns {void}
 */
function setPreference(key, value) {
    return localStorage.setItem(`__btimport__${key}_${BT_SELECTED_CONFIG}`, value.toString())
}

function setupApiKey() {
    window.open(`${BT_BASE_URL}/client-file-flow/${BT_CLIENT_ID}`)
    const inputHtml = `
    <div id="api-key-setup" style="background-color: #fff">
        <form id="api-key-form">
            <input type="text" id="api-key-form-key" placeholder="Copy API Key here"/>
            <input type="submit" value="Save">
        </form>
    </div>
    `

    document.querySelector(".box-content").insertAdjacentHTML("afterend", inputHtml);
    document.querySelector("#api-key-setup").addEventListener("submit", submitApiKey);
}

function submitApiKey(event) {
    event.preventDefault();

    const apiKey = document.querySelector("#api-key-form-key").value;
    setPreference(API_KEY, apiKey);

    location.reload();
}

function addNav() {
    const topNode = document.querySelector(".box-content");
    const hasApiKey = !!getPreference(API_KEY);

    const apiKeyText = "You don't have an API key set up. Please set up an API key before proceeding.";
    const apiKeyParagraph = document.createElement("p");

    if (!hasApiKey) {
        apiKeyParagraph.append(document.createTextNode(apiKeyText));
        apiKeyParagraph.append(document.createElement("br"));
    }

    let apiKeyLink = hasApiKey ? "Reconfigure API key (if broken)" : "Set up API key";

    const apiKeySetup = document.createElement("a");
    apiKeySetup.id = "setup-api-key-onclick";
    apiKeySetup.append(document.createTextNode(apiKeyLink));
    apiKeySetup.onclick = setupApiKey;

    apiKeyParagraph.append(apiKeySetup);

    const navHtml = document.createElement("div");
    navHtml.append(apiKeyParagraph);
    navHtml.style = `
        color: white;
        width: 100%;
        background-color: rgba(51, 50, 62, .75);
        text-align: center;
    `

    if (hasApiKey) {
        const pollButton = document.createElement("a");
        pollButton.id = "bt-poll-button";
        pollButton.onclick = startPolling;
        pollButton.innerText = "- Start polling";
        navHtml.append(pollButton);

        navHtml.append(document.createElement("br"));

        const b30Button = document.createElement("a");
        b30Button.id = "bt-b30-button";
        b30Button.onclick = executeB30Import;
        b30Button.innerText = "- (REQUIRES ARCAEA ONLINE SUBSCRIPTION) Import best 30 scores";
        navHtml.append(b30Button);
    }

    navHtml.id = "bt-import";
    topNode.append(navHtml);
}

async function startPolling() {
    polling = true;
    
    const pollButton = document.querySelector("#bt-poll-button");
    
    pollButton.innerText = "- Stop polling";
    pollButton.onclick = () => {
        updateStatus("Stopped polling.")
        pollButton.onclick = startPolling;
        pollButton.innerText = "Start polling";
        polling = false;
    }

    while (polling) {
        let currentTime = Date.now();
        
        if (currentTime - latestScoreTimestamp === 15 * 60 * 1000) {
            updateStatus("Script timed out. Stopped polling.")
            pollButton.onclick = startPolling;
            pollButton.innerText = "- Start polling";
            polling = false;
            break;
        }
        
        /**
         * @type {ArcaeaResponse<ProfileData>}
         */
        const resp = await fetch("https://webapi.lowiro.com/webapi/user/me").then((r) => r.json());
        
        console.log(resp);

        if (!resp.success) {
            updateStatus("Could not poll for most recent score. See the console for more details.");
            pollButton.onclick = startPolling;
            pollButton.innerText = "- Start polling";
            polling = false;
            break;
        }
        
        await executeRecentImport(resp.value.recent_score[0]);
        await new Promise(r => setTimeout(r, 90000));
    }
}

function updateStatus(message) {
    let importElem = document.querySelector("#bt-import");
    let statusElem = document.querySelector("#bt-import-status");
    if (!statusElem) {
        statusElem = document.createElement("p");
        statusElem.id = "bt-import-status";
        importElem.append(statusElem);
    }
    statusElem.innerText = message;
}

/**
 * 
 * @param {Omit<BatchManualImport, "meta">} options 
 * @returns 
 */
async function submitScore(options) {
    const { scores = [] } = options;

    if (scores.length === 0) {
        updateStatus("Nothing to import.");
        return;
    }

    /**
     * @type {BatchManualImport}
     */
    const body = {
        meta: {
            game: "arcaea",
            playtype: "Touch",
            service: "bt-arcaea-site-poller",
        },
        scores,
    }

    const req = fetch(`${BT_BASE_URL}/ir/direct-manual/import`, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + getPreference(API_KEY),
            "Content-Type": "application/json",
            "X-User-Intent": "true",
        },
        body: JSON.stringify(body)
    });

    updateStatus("Submitting scores...");
    const json = await (await req).json();
    const pollUrl = json.body.url;

    pollStatus(pollUrl, scores);
}

async function pollStatus(url, scores) {
    const req = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${getPreference(API_KEY)}`,
        }
    });

    const body = await req.json();

    if (!body.success) {
        updateStatus("Terminal Error: " + body.description);
        return;
    }

    if (body.body.importStatus === "ongoing") {
        updateStatus("Importing scores... " + body.description + " Progress: " + body.body.progress.description);
        setTimeout(pollStatus, 1000, url);
        return;
    }

    if (body.body.importStatus === "completed") {
        console.log(body.body);
        let message;
        if (scores.length === 1) {
            let score = scores[0];
            message = `${body.description}
            - Song ID: ${score.identifier}
            - Score: ${score.score}
            - Lamp: ${score.lamp}
            - Judgements: ${score.judgements.pure}-${score.judgements.far}-${score.judgements.lost}
            - Time played: ${new Date(score.timeAchieved).toString()}
            `;
        } else {
            message = `${body.description} ${body.body.import.scoreIDs.length} scores.`;
        }

        if (body.body.import.errors.length > 0) {
            message += `, ${body.body.import.errors.length} errors (see console log for details)`;
            for (const error of body.body.import.errors) {
                console.log(`${error.type}: ${error.message}`);
            }
        }
        updateStatus(message);
        return;
    }

    // otherwise, just print the description cuz we're not sure what happened
    updateStatus(body.description);
}

/**
 * 
 * @param {RecentScore} data 
 */
async function executeRecentImport(data) {
    console.log(data);
    
    const { song_id, difficulty, score, shiny_perfect_count, perfect_count, near_count, miss_count, clear_type, time_played, health } = data;
    /**
     * @type {BatchManualScore}
     */
    const btScore = {
        identifier: song_id,
        matchType: "inGameStrID",
        difficulty: DIFFICULTIES[difficulty],
        score: score,
        lamp: LAMPS[clear_type],
        judgements: {
            pure: perfect_count,
            far: near_count,
            lost: miss_count,
        },
        timeAchieved: time_played,
        optional: {
            shinyPure: shiny_perfect_count,
            gauge: health,
        }
    }

    if (time_played > latestScoreTimestamp) {
        latestScoreTimestamp = time_played;
        console.log(btScore);
        submitScore({ scores: [btScore] });
    }
}

async function executeB30Import(data) {
    /**
     * @type {ArcaeaResponse<RatedScores>}
     */
    const resp = await fetch("https://webapi.lowiro.com/webapi/score/rating/me").then((r) => r.json());
    
    console.log(resp);

    if (!resp.success) {
        updateStatus(`Could not fetch best/recent rated scores: ${resp.error_code}`);
        return;
    }

    /**
     * @type {BatchManualScore[]}
     */
    const scores = [];
    
    for (const score of resp.value.best_rated_scores.concat(resp.value.recent_rated_scores)) {
        /**
         * @type {BatchManualScore}
         */
        const btScore = {
            identifier: score.song_id,
            matchType: "inGameStrID",
            difficulty: DIFFICULTIES[score.difficulty],
            score: score.score,
            lamp: LAMPS[score.clear_type],
            judgements: {
                pure: score.perfect_count,
                far: score.near_count,
                lost: score.miss_count,
            },
            timeAchieved: score.time_played,
            optional: {
                shinyPure: score.shiny_perfect_count,
            },
        };

        scores.push(btScore);
    }

    submitScore({ scores });
}

console.log("running");

let injectedElement = document.querySelector(".banner.castle-banner");
if (injectedElement === null) {
    const observedNode = document.getElementById("app");
    const config = { childList: true };

    function observerCallback(mutationList, observer) {
        observer.disconnect();
        for (const mutation of mutationList) {
            if (mutation.type === "childList") {
                injectedElement = document.querySelector(".banner.castle-banner");

                if (injectedElement !== null) {
                    switch (location.pathname) {
                        case "/en/profile/":
                        case "/jp/profile/":
                            addNav();
                            break;
                    }
                }
            }
        }
    }

    const observer = new MutationObserver(observerCallback);
    observer.observe(observedNode, config);
} else {
    switch (location.pathname) {
        case "/en/profile/":
        case "/jp/profile/":
            addNav();
            break;
    }
}
