var aryData = [], aryShow = [];
var svgLine = document.getElementById('svgLine');
var svgPie = document.getElementById('svgPie');
var startMonth = document.getElementById('startMonth'), endMonth = document.getElementById('endMonth');
var xmls = 'http://www.w3.org/2000/svg';
var svgLineWidth, svgLineHeight;
var padLeft = 60, padTop = 30;                  // 距離左側右側 60px，距離上緣下緣 30px
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
    UIInit();
    DataInit();
    RangeInit();
    StartEndInit();
    CheckInit();
    EventInit();
    DrawGraph();
}

/**
 * UI 動態調整
 */
function UIInit(){
    let colors = document.getElementById('divControl').querySelectorAll('input[type="color"]');
    for(let i = 0, n = colors.length; i < n; i++){
        colors[i].parentNode.style.backgroundColor = colors[i].value;
    }
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
        obj['Sum'] = parseFloat(datas[2]);              // 再生能源發電量合計
        obj['Hydra'] = parseFloat(datas[3]);            // 慣常水力
        obj['Geo'] = parseFloat(datas[4]);              // 地熱
        obj['Solar'] = parseFloat(datas[5]);            // 太陽光電
        obj['Wind'] = parseFloat(datas[6]);             // 風力_小計
        obj['WindLand'] = parseFloat(datas[7]);        // 風力_陸域
        obj['WindOffShore'] = parseFloat(datas[8]);    // 風力_離岸
        obj['Bio'] = parseFloat(datas[9]);              // 生質能_小計
        obj['BioSolid'] = parseFloat(datas[10]);       // 生質能_固態
        obj['BioGas'] = parseFloat(datas[11]);         // 生質能_氣態
        obj['Waste'] = parseFloat(datas[12]);           // 廢棄物
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
        colors[i].addEventListener('change', function(){
            colors[i].parentNode.style.backgroundColor = colors[i].value;
        });
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
        // 清空
        while(svgLine.firstChild){
            svgLine.removeChild(svgLine.firstChild);
        }
        if(dataMax < dataMin) return;
        let printData = CalculateInterval();
        DrawLineGraph(printData);
    }
}

/**
 * 繪製折線圖圖表
 */
function DrawLineGraph(printData){

    printData = DrawAxisGrid(printData);
    DrawLineMain(printData);
}

/**
 * 繪製座標軸
 * @param {array} printData 
 */
function DrawAxisGrid(printData){

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
    text.setAttribute('x', padLeft);
    text.setAttribute('y', padTop / 1.5);
    text.setAttribute('color', 'black');
    text.setAttribute('id', 'axisTextY');
    svgLine.appendChild(text);

    let drawBottomY = svgLineHeight - padTop * (printData[1] == 0 ? 1 : 2);
    let drawTopY = padTop;
    let drawDiffY = (drawBottomY - drawTopY) * printData[3] / (printData[0] - printData[1]);
    let positionY = drawBottomY;
    let intervalWidthSmall = 6, intervalWidthBig = 10;
    let drawValue = printData[1];
    while(drawValue <= printData[0]){
        let seg = document.createElementNS(xmls, 'line');
        if(drawValue % printData[2] == 0){
            seg.setAttribute('x1', padLeft - intervalWidthBig);

            let txt = document.createElementNS(xmls, 'text');
            txt.textContent = drawValue;
            txt.setAttribute('x', 3);
            txt.setAttribute('y', positionY + 2);
            txt.setAttribute('color', 'black');
            txt.setAttribute('font-size', '12');
            svgLine.appendChild(txt);

            let grid = document.createElementNS(xmls, 'line');
            grid.setAttribute('x1', padLeft);
            grid.setAttribute('y1', positionY);
            grid.setAttribute('x2', svgLineWidth - padLeft);
            grid.setAttribute('y2', positionY);
            grid.setAttribute('stroke', 'lightgray');
            grid.setAttribute('stroke-width', '0.5');
            svgLine.appendChild(grid);
        }
        else{
            seg.setAttribute('x1', padLeft - intervalWidthSmall);
        }
        seg.setAttribute('y1', positionY);
        seg.setAttribute('x2', padLeft);
        seg.setAttribute('y2', positionY);
        seg.setAttribute('stroke', 'black');
        seg.setAttribute('stroke-width', '0.5');
        svgLine.appendChild(seg);
        drawValue += printData[3];
        positionY -= drawDiffY;
    }

    let drawDiffX = (svgLineWidth - padLeft * 2) / (aryShow.length + 1);
    let positionX = padLeft;
    let drawBottomX = svgLineHeight - padTop;
    for(let i = 0, n = aryShow.length; i < n; i++){
        positionX += drawDiffX;
        let item = aryShow[i];

        let seg = document.createElementNS(xmls, 'line');
        seg.setAttribute('x1', positionX);
        seg.setAttribute('y1', drawBottomX);
        seg.setAttribute('x2', positionX);
        if(item.month == 1){
            seg.setAttribute('y2', svgLineHeight - padTop + intervalWidthBig);

            let txt = document.createElementNS(xmls, 'text');
            if(n > 25) txt.textContent = item.year + '年';
            else txt.textContent = item.year + '年1月';
            txt.setAttribute('x', positionX - 15);
            txt.setAttribute('y', svgLineHeight - padTop + intervalWidthBig + 15);
            txt.setAttribute('color', 'black');
            txt.setAttribute('font-size', '12');
            svgLine.appendChild(txt);

        }
        else{
            seg.setAttribute('y2', svgLineHeight - padTop + intervalWidthSmall);
            if(item.month == 6 && n <= 25){
                let txt = document.createElementNS(xmls, 'text');
                txt.textContent = item.year + '年6月';
                txt.setAttribute('x', positionX - 15);
                txt.setAttribute('y', svgLineHeight - padTop + intervalWidthBig + 15);
                txt.setAttribute('color', 'black');
                txt.setAttribute('font-size', '12');
                svgLine.appendChild(txt);
            }
            else if(item.month != 6 && n < 11){
                let txt = document.createElementNS(xmls, 'text');
                txt.textContent = item.year + '年' + item.month + '月';
                txt.setAttribute('x', positionX - 15);
                txt.setAttribute('y', svgLineHeight - padTop + intervalWidthBig + 15);
                txt.setAttribute('color', 'black');
                txt.setAttribute('font-size', '12');
                svgLine.appendChild(txt);
            }
        }
        seg.setAttribute('stroke', 'black');
        seg.setAttribute('stroke-width', '0.5');
        svgLine.appendChild(seg);
    }
    return [printData[0], printData[1], drawTopY, drawBottomY, padLeft + drawDiffX, drawDiffX];

}

/**
 * 主要拆線圖內容的繪製
 * @param {array} printData 
 */
function DrawLineMain(printData){
    if(aryShow.length == 0) return;

    let overAll = printData[0] - printData[1];
    if(IsCheck('Sum')) DrawPolyLine('Sum', printData, '發電量合計');
    if(IsCheck('Hydra')) DrawPolyLine('Hydra', printData, '慣常水力');
    if(IsCheck('Geo')) DrawPolyLine('Geo', printData, '地熱');
    if(IsCheck('Solar')) DrawPolyLine('Solar', printData, '太陽光電');
    if(IsCheck('Wind')) DrawPolyLine('Wind', printData, '風力');
    if(IsCheck('WindLand')) DrawPolyLine('WindLand', printData, '風力 陸域');
    if(IsCheck('WindOffShore')) DrawPolyLine('WindOffShore', printData, '風力 離岸');
    if(IsCheck('Bio')) DrawPolyLine('Bio', printData, '生質能');
    if(IsCheck('BioSolid')) DrawPolyLine('BioSolid', printData, '生質能 固態');
    if(IsCheck('BioGas')) DrawPolyLine('BioGas', printData, '生質能 氣態');
    if(IsCheck('Waste')) DrawPolyLine('Waste', printData, '廢棄物');
    
    if(IsCheck('Event')){
        let sYM = document.getElementById('startMonth').value.split('_'), eYM = document.getElementById('endMonth').value.split('_');

        for(let i = 0, n = eventData.length; i < n; i++){

        }
    }
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
            if(IsCheck('Sum')){
                if(data.Sum > dataMax) dataMax = data.Sum;
                if(data.Sum < dataMin) dataMin = data.Sum;
            }
            if(IsCheck('Hydra')){
                if(data.Hydra > dataMax) dataMax = data.Hydra;
                if(data.Hydra < dataMin) dataMin = data.Hydra;
            }
            if(IsCheck('Geo')){
                if(data.Geo > dataMax) dataMax = data.Geo;
                if(data.Geo < dataMin) dataMin = data.Geo;
            }
            if(IsCheck('Solar')){
                if(data.Solar > dataMax) dataMax = data.Solar;
                if(data.Solar < dataMin) dataMin = data.Solar;
            }
            if(IsCheck('Wind')){
                if(data.Wind > dataMax) dataMax = data.Wind;
                if(data.Wind < dataMin) dataMin = data.Wind;
            }
            if(IsCheck('WindLand')){
                if(data.WindLand > dataMax) dataMax = data.WindLand;
                if(data.WindLand < dataMin) dataMin = data.WindLand;
            }
            if(IsCheck('WindOffShore')){
                if(data.WindOffShore > dataMax) dataMax = data.WindOffShore;
                if(data.WindOffShore < dataMin) dataMin = data.WindOffShore;
            }
            if(IsCheck('Bio')){
                if(data.Bio > dataMax) dataMax = data.Bio;
                if(data.Bio < dataMin) dataMin = data.Bio;
            }
            if(IsCheck('BioSolid')){
                if(data.BioSolid > dataMax) dataMax = data.BioSolid;
                if(data.BioSolid < dataMin) dataMin = data.BioSolid;
            }
            if(IsCheck('BioGas')){
                if(data.BioGas > dataMax) dataMax = data.BioGas;
                if(data.BioGas < dataMin) dataMin = data.BioGas;
            }
            if(IsCheck('Waste')){
                if(data.Waste > dataMax) dataMax = data.Waste;
                if(data.Waste < dataMin) dataMin = data.Waste;
            }
        }
    }
}

/**
 * 計算 y 軸間隔
 */
function CalculateInterval(){
    let printMax, printMin, intervalBig, intervalSmall;
    if(dataMax == 0) return [10, 0, 10, 1];
    if(dataMax == dataMin) return [dataMax + 5, dataMax - 5, 10, 1];
    let nMax = Math.floor(Math.log10(dataMax));
    intervalBig = Math.pow(10, nMax);
    intervalSmall = Math.pow(10, nMax - 1);
    printMax = Math.ceil(dataMax / (Math.pow(10, nMax - 1))) * intervalSmall;
    if(dataMin == 0){
        if(printMax / intervalBig < 2){
            intervalBig /= 10;
            intervalSmall /= 10;
        }
        return [printMax, 0, intervalBig, intervalSmall];
    }        
    printMin = Math.trunc(dataMin) - (Math.trunc(dataMin) % intervalSmall);
    if(printMin < 0) printMin = 0;
    if(printMax / intervalBig < 2){
        intervalBig /= 10;
        intervalSmall /= 10;
    }
    return [printMax, printMin, intervalBig, intervalSmall];
}

function IsCheck(keyword){
    return document.getElementById('chk' + keyword).checked;
}

function DrawPolyLine(keyword, printData, text){
    let points = [];
    let overAll = printData[0] - printData[1];
    let txtY = 0;
    let color = document.getElementById('col' + keyword).value;
    for(let i = 0, n = aryShow.length; i < n; i++){
        let val = aryShow[i][keyword];
        let x = printData[4] + printData[5] * i; 
        let y = printData[2] + (printData[3] - printData[2]) * (printData[0] - val) / overAll;
        txtY = y;
        points.push(x + ',' + y);
    }
    let poly = document.createElementNS(xmls, 'polyline');
    poly.setAttribute('points', points.join(' '));
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', color);
    poly.setAttribute('stroke-width', '0.5');
    svgLine.appendChild(poly);

    let txt = document.createElementNS(xmls, 'text');
    txt.setAttribute('x', printData[4] + printData[5] * aryShow.length);
    txt.setAttribute('y', txtY);
    txt.textContent = text;
    txt.setAttribute('stroke', color);
    txt.setAttribute('stroke-width', '0.5');
    txt.setAttribute('font-size', '12');
    svgLine.appendChild(txt);
}