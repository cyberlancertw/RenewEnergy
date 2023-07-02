var aryData = [], aryShow = [];
var svgLine = document.getElementById('svgLine');
var svgPie = document.getElementById('svgPie');
var startMonth = document.getElementById('startMonth'), endMonth = document.getElementById('endMonth');
var xmls = 'http://www.w3.org/2000/svg';
var svgLineWidth, svgLineHeight;
var padLeft = 30, padTop = 30;                  // 距離左側右側 30px，距離上緣下緣 30px
var dataMax, dataMin;
window.addEventListener('load', Init)

/**
 * DOM 結構完成後的作業
 * @returns 
 */
function Init(){
    if(!energyData) {
        console.error('缺少資料，已結束');
        return;
    }
    DataInit();
    RangeInit();
    StartEndInit();
    CheckInit();
    EventInit();
    DrawGraph();
}

/**
 * 將 csv 資料轉成物件
 * @returns 
 */
function DataInit(){
    let dataSplit = energyData.split('\n');
    for (let i = 0, n = dataSplit.length; i < n; i++) {
        let dataString = dataSplit[i];
        if(dataString == '' || dataString.length == 0 || dataString.substr(0,2) == '日期') continue;    // 跳過空列和標頭列
        let datas = dataString.split(',');
        if(datas.length != 13){
            console.error('資料格式有變動，已結束');
            return;
        }
        let obj = {};
        obj['year'] = parseInt(datas[0].substr(0, 4));  // 日期_年
        obj['month'] = parseInt(datas[0].substr(4, 2)); // 日期_月
        obj['date'] = obj.month == 12 ? (new Date(obj.year + 1, 0, 0)) : (new Date(obj.year, obj.month, 0));
        obj['sum'] = parseFloat(datas[2]);              // 再生能源發電量合計
        obj['hydra'] = parseFloat(datas[3]);            // 慣常水力
        obj['geo'] = parseFloat(datas[4]);              // 地熱
        obj['solar'] = parseFloat(datas[5]);            // 太陽光電
        obj['wind'] = parseFloat(datas[6]);             // 風力_小計
        obj['wind_land'] = parseFloat(datas[7]);        // 風力_陸域
        obj['wind_offshore'] = parseFloat(datas[8]);    // 風力_離岸
        obj['bio'] = parseFloat(datas[9]);              // 生質能_小計
        obj['bio_solid'] = parseFloat(datas[10]);       // 生質能_固態
        obj['bio_gas'] = parseFloat(datas[11]);         // 生質能_氣態
        obj['waste'] = parseFloat(datas[12]);           // 廢棄物
        aryData.push(obj);
    }
}

/**
 * 右上角顯示資料範圍
 * @returns 
 */
function RangeInit(){
    if(!aryData || aryData.length == 0){
        console.error('資料異常為空，已結束');
        return;
    }
    let sYear = aryData[0].year,
    sMonth = aryData[0].month,
    eYear = aryData[aryData.length - 1].year,
    eMonth = aryData[aryData.length - 1].month;
    document.getElementById('spanRange').textContent = sYear + '年' + (sMonth < 10 ? '0' + sMonth : sMonth) + '月 至 ' + eYear + '年' + (eMonth < 10 ? '0' + eMonth : eMonth) + '月';
}

/**
 * 上面中間的起訖年月的下拉選單
 */
function StartEndInit(){
    let docFrag1 = document.createDocumentFragment();
    let docFrag2 = document.createDocumentFragment();
    for(let i = 0, n = aryData.length; i < n; i++){
        let y = aryData[i].year, m = aryData[i].month;
        let text = y + '年' + (m < 10 ? '0' + m : m) + '月';
        let value = y + '_' + m;
        let opt1 = new Option(text, value), opt2 = new Option(text, value);
        docFrag1.appendChild(opt1);
        docFrag2.appendChild(opt2);
    }
    startMonth.appendChild(docFrag1);
    startMonth.selectedIndex = 0;

    endMonth.appendChild(docFrag2);
    endMonth.selectedIndex = aryData.length - 1;
}

/**
 * 預設勾選的項目
 */
function CheckInit(){
    document.getElementById('chkHydra').checked = true;     // 慣常水力
    document.getElementById('chkGeo').checked = true;       // 地熱
    document.getElementById('chkSolar').checked = true;     // 太陽光電
    document.getElementById('chkWind').checked = true;      // 風力
    document.getElementById('chkBio').checked = true;       // 生質能
    document.getElementById('chkWaste').checked = true;     // 廢棄物
    document.getElementById('chkEvent').checked = true;     // 事件
}

/**
 * 事件監聽的設定
 */
function EventInit(){    
    let domList = [];

    // 上面中間的起訖年月下拉選單
    domList.push(startMonth);
    domList.push(endMonth);

    // 左側勾選項目
    let checks = document.getElementById('divControl').querySelectorAll('input[type="checkbox"]');
    for(let i = 0, n = checks.length; i < n; i++){
        domList.push(checks[i]);
    }

    // 左側顏色項目
    let colors = document.getElementById('divControl').querySelectorAll('input[type="color"]');
    for(let i = 0, n = colors.length; i < n; i++){
        domList.push(colors[i]);
    }
    for(let i = 0, n = domList.length; i < n; i++){
        domList[i].addEventListener('change', DrawGraph);
    }
}

/**
 * 繪製圖表主要函式
 */
function DrawGraph(){
    let s = startMonth.value, e = endMonth.value;
    let sIdx = startMonth.selectedIndex, eIdx = endMonth.selectedIndex;
    // 選取年月若相同，繪製圓餅圖
    if(s == e){
        DrawPieGraph();
    } else{
        // 檢查起訖年月的先後是否正確，若不是則對調
        let sYM = s.split('_'), eYM = e.split('_');
        let sDT = sYM[1] == 12 ? (new Date(sYM[0] + 1, 0, 0)) : (new Date(sYM[0], sYM[1], 0)), 
            eDT = eYM[1] == 12 ? (new Date(eYM[0] + 1, 0, 0)) : (new Date(eYM[0], eYM[1], 0));
        if(sDT > eDT){
            startMonth.selectedIndex = eIdx;
            endMonth.selectedIndex = sIdx;
            GetDataInRange(eDT, sDT);
        }
        else{
            GetDataInRange(sDT, eDT);
        }
        if(dataMax < dataMin) return;
        CalculateInterval();
        DrawLineGraph();
    }
}

/**
 * 繪製折線圖圖表
 */
function DrawLineGraph(){
    console.log(svgLine);
    // 清空
    while(svgLine.firstChild){
        svgLine.removeChild(svgLine.firstChild);
    }
    DrawAxisGrid();

}

function DrawAxisGrid(){

    svgLineWidth = svgLine.width.baseVal.value;
    svgLineHeight = svgLine.height.baseVal.value;

    let axisX = document.createElementNS(xmls,'line');      // x 橫軸
    axisX.setAttribute('x1', padLeft);
    axisX.setAttribute('y1', svgLineHeight - padTop);
    axisX.setAttribute('x2', svgLineWidth - padLeft);
    axisX.setAttribute('y2', svgLineHeight - padTop);
    axisX.setAttribute('id', 'axisX');
    svgLine.appendChild(axisX);

    let axisY = document.createElementNS(xmls, 'line');     // y 縱軸
    axisY.setAttribute('x1', padLeft);
    axisY.setAttribute('y1', svgLineHeight - padTop);
    axisY.setAttribute('x2', padLeft);
    axisY.setAttribute('y2', padTop);
    axisY.setAttribute('id', 'axisY');
    svgLine.appendChild(axisY);

    let text = document.createElementNS(xmls, 'text');      // y 縱軸文字
    text.textContent = '發電量(千度)';
    text.setAttribute('x', padLeft / 4);
    text.setAttribute('y', padTop / 1.5);
    text.setAttribute('color', 'black');
    text.setAttribute('id', 'axisTextY');
    svgLine.appendChild(text);

    
}

/**
 * 繪製圓餅圖圖表
 */
function DrawPieGraph(){
    console.log(svgPie);
    // 清空
    while(svgPie.firstChild){
        svgPie.removeChild(svgPie.firstChild);
    }
}

/**
 * 取得範圍內的資料，同時取得勾選類別中的最大值最小值
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
function GetDataInRange(startDate, endDate){
    aryShow = [];
    dataMax = 0;
    dataMin = Number.MAX_VALUE;
    for(let i = 0, n = aryData.length; i < n; i++){
        let data = aryData[i];
        if(data.date >= startDate && data.date <= endDate){
            aryShow.push(data);
            if(document.getElementById('chkSum').checked){
                if(data.sum > dataMax) dataMax = data.sum;
                if(data.sum < dataMin) dataMin = data.sum;
            }
            if(document.getElementById('chkHydra').checked){
                if(data.hydra > dataMax) dataMax = data.hydra;
                if(data.hydra < dataMin) dataMin = data.hydra;
            }
            if(document.getElementById('chkGeo').checked){
                if(data.geo > dataMax) dataMax = data.geo;
                if(data.geo < dataMin) dataMin = data.geo;
            }
            if(document.getElementById('chkSolar').checked){
                if(data.solar > dataMax) dataMax = data.solar;
                if(data.solar < dataMin) dataMin = data.solar;
            }
            if(document.getElementById('chkWind').checked){
                if(data.wind > dataMax) dataMax = data.wind;
                if(data.wind < dataMin) dataMin = data.wind;
            }
            if(document.getElementById('chkWindLand').checked){
                if(data.wind_land > dataMax) dataMax = data.wind_land;
                if(data.wind_land < dataMin) dataMin = data.wind_land;
            }
            if(document.getElementById('chkWindOffShore').checked){
                if(data.wind_offshore > dataMax) dataMax = data.wind_offshore;
                if(data.wind_offshore < dataMin) dataMin = data.wind_offshore;
            }
            if(document.getElementById('chkBio').checked){
                if(data.bio > dataMax) dataMax = data.bio;
                if(data.bio < dataMin) dataMin = data.bio;
            }
            if(document.getElementById('chkBioSolid').checked){
                if(data.bio_solid > dataMax) dataMax = data.bio_solid;
                if(data.bio_solid < dataMin) dataMin = data.bio_solid;
            }
            if(document.getElementById('chkBioGas').checked){
                if(data.bio_gas > dataMax) dataMax = data.bio_gas;
                if(data.bio_gas < dataMin) dataMin = data.bio_gas;
            }
            if(document.getElementById('chkWaste').checked){
                if(data.waste > dataMax) dataMax = data.waste;
                if(data.waste < dataMin) dataMin = data.waste;
            }

        }
    }
}

/**
 * 計算 y 軸間隔
 */
function CalculateInterval(){
    console.log('m:' + dataMax);
    console.log('n:' + dataMin);
    let d = (dataMax - dataMin) / 10;     // 全距分 10 等分
    console.log('d:' + d);
    let p = Math.floor(Math.log10(d));    // 首數
    console.log('p:' + p);
    let b = Math.pow(10, p);
    console.log('b:' + b);
    let r = d % b;
    console.log('r:' + r);
}