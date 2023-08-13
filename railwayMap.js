async function main() {
  const funName = main.name;
  //エレメント名
  const eleCompany = "listBoxCompany";
  const eleLine = "listBoxLine";
  const eleSvg = "divSvg";
  //事業者リストボックス、路線リストボックス、svg
  let lbCompany = document.getElementById(eleCompany);
  let lbLine = document.getElementById(eleLine);
  let divSvg = document.getElementById(eleSvg);
  //選択中事業者オプション、選択中路線オプション
  let soCompany = null;
  let soLine = null;
  //現在の路線geoデータ
  let lastLineGeoMap = null;
  //現在の駅geoデータ
  let lastStaGeoMap = null;
  //現在のパラメータ（幅、高さ、経度緯度範囲、スケール、経度0緯度0位置）
  let lastPara = null;

  //路線データjson取得
  // const railroadFileName = "test_N02-21_RailroadSection.geojson";
  const rFileName = "N02-21_RailroadSection.geojson";
  let geoLineJson = await getGeoJson(rFileName);
  //駅データjson取得
  const sFileName = "N02-21_Station.geojson";
  let geoStaJson = await getGeoJson(sFileName);

  //路線名map取得
  let lineNameMap = await getLineNameMap(geoLineJson);
  // console.log("getLineNameMap", lineNameMap);
  //駅名map取得
  let staNameMap = await getStaNameMap(geoStaJson);
  // console.log("getStaNameMap", staNameMap);

  //マウスイベントホルダ
  let mouseEventsHolder = new MouseEventsHolder();
  mouseEventsHolder.lineNameMap = lineNameMap;
  mouseEventsHolder.staNameMap = staNameMap;

  //右ボタンメニューを無効にする
  divSvg.addEventListener("contextmenu", function(e) {
    e.preventDefault();
  });

  //全事業者全路線表示（初期表示）
  {
    //路線geoデータ取得
    lastLineGeoMap = await getLineGeometry(geoLineJson, null, null, null);
    // console.log("lastLineGeoMap", lastLineGeoMap);
    //駅geoデータ取得
    lastStaGeoMap = await getStaGeometry(geoStaJson, null, null, null, null);
    // console.log("getStaGeometry", lastStaGeoMap);
    //パラメータ
    lastPara = await getLastPara(divSvg, lastLineGeoMap);
    // console.log("getLastPara", lastPara);
    d3
      .select("#" + eleSvg)
      .append("svg")
      .attr("width", lastPara.width)
      .attr("height", lastPara.height);
    d3.select("g").remove();
    // await appendSvg(lastLineGeoMap, lastPara, mouseEventsHolder);
    await appendSvg(
      lastLineGeoMap,
      lastStaGeoMap,
      lastPara,
      mouseEventsHolder
    );
  }

  //事業者リストボックス事業者名追加
  {
    let foo = await getCompanyList(geoLineJson);
    foo.forEach(element => {
      let bar = document.createElement("option");
      bar.text = element;
      bar.value = element;
      lbCompany.add(bar);
    });
  }

  //事業者リストボックスイベント
  {
    lbCompany.addEventListener("change", companyEvent);
    lbCompany.addEventListener("click", companyEvent);

    async function companyEvent() {
      soCompany = this.options[this.selectedIndex];
      soLine = null;
      //選択された事業者の路線リスト取得
      let foo = await getLineList(geoLineJson, soCompany.text);
      //路線リストボックスクリア
      while (lbLine.firstChild) {
        lbLine.removeChild(lbLine.firstChild);
      }
      //路線リストボックスに路線名追加
      foo.forEach(element => {
        let bar = document.createElement("option");
        bar.text = element;
        bar.value = element;
        lbLine.add(bar);
      });
      //選択事業者全路線表示
      {
        //選択事業者のgeo取得
        let bar = await getLineGeometry(
          geoLineJson,
          null,
          soCompany.text,
          null
        );
        //選択事業者をビューポートに表示するlastPara取得
        lastPara = await getLastPara(divSvg, bar);
        //選択事業者のlastParaで範囲取得
        let baz = await GetViewportRange(lastPara);
        //その範囲に含まれる路線geo取得（選択事業者以外も含む）
        lastLineGeoMap = await getLineGeometry(geoLineJson, baz, null, null);
        //その範囲に含まれる駅geo取得（選択事業者以外も含む）
        lastStaGeoMap = await getStaGeometry(geoStaJson, baz, null, null, null);
        //lastSelName設定
        mouseEventsHolder.lastSelName = [soCompany.text, null];
        //表示
        d3.select("g").remove();
        // await appendSvg(lastLineGeoMap, lastPara, mouseEventsHolder);
        await appendSvg(
          lastLineGeoMap,
          lastStaGeoMap,
          lastPara,
          mouseEventsHolder
        );
      }
    }
  }

  //路線リストボックスイベント
  {
    lbLine.addEventListener("change", lineEvent);
    lbLine.addEventListener("click", lineEvent);

    async function lineEvent() {
      soLine = this.options[this.selectedIndex];
      //選択事業者選択路線のgeo取得（路線で拡大したい場合はこちら）
      // let bar = await getGeometry2(geoJson, null, soCompany.text, soLine.text);
      //選択事業者のgeo取得（事業者で拡大したい場合はこちら）
      let bar = await getLineGeometry(geoLineJson, null, soCompany.text);
      //選択路線geoでlastPara取得
      lastPara = await getLastPara(divSvg, bar);
      //選択路線のlastParaで範囲取得
      let baz = await GetViewportRange(lastPara);
      //その範囲に含まれる路線geo取得（選択路線以外も含む）
      lastLineGeoMap = await getLineGeometry(geoLineJson, baz, null, null);
      //その範囲に含まれる駅geo取得（選択路線以外も含む）
      lastStaGeoMap = await getStaGeometry(geoStaJson, baz, null, null, null);
      //lastSelName設定
      // lastSelName = [soCompany.text, soCompany.text + "_" + soLine.text];
      mouseEventsHolder.lastSelName = [
        soCompany.text,
        soCompany.text + "_" + soLine.text
      ];
      // console.log("lineEvent", lastSelName);
      //表示
      d3.select("g").remove();
      // await appendSvg2(lastPara, lastGeoMap, nameMap, lastSelName);
      // await appendSvg(lastLineGeoMap, lastPara, mouseEventsHolder);
      await appendSvg(
        lastLineGeoMap,
        lastStaGeoMap,
        lastPara,
        mouseEventsHolder
      );
    }
  }

  //ドラッグイベント
  {
    let isDragging = false; //true:移動中
    let lastDownXY = null; //ドラッグ開始位置xy座標

    d3.select("#" + eleSvg).on("mousedown", async function(event) {
      // console.log("mousedown", event.clientX, event.clientY);
      if (event.button == 0) {
        //ドラッグ開始位置保存
        lastDownXY = [event.clientX, event.clientY];
        //ドラッグ開始
        isDragging = true;
      } else if (event.button == 2) {
        //選択を無効にして再表示
        lastSelName = [null, null];
        mouseEventsHolder.lastSelName = [null, null];
        //表示
        d3.select("g").remove();
        // await appendSvg(lastLineGeoMap, lastPara, mouseEventsHolder);
        await appendSvg(
          lastLineGeoMap,
          lastStaGeoMap,
          lastPara,
          mouseEventsHolder
        );
      }
    });

    d3.select("#" + eleSvg).on("mousemove", async function(event) {
      if (isDragging) {
        // console.log("mousemove", event.clientX, event.clientY);
        let foo = [
          lastPara.translate[0] + event.clientX - lastDownXY[0],
          lastPara.translate[1] + event.clientY - lastDownXY[1]
        ];
        let bar = {
          width: lastPara.width,
          height: lastPara.height,
          range: lastPara.range,
          scale: lastPara.scale,
          translate: foo
        };
        d3.select("g").remove();
        // await appendSvg(lastLineGeoMap, bar, mouseEventsHolder);
        await appendSvg(lastLineGeoMap, lastStaGeoMap, bar, mouseEventsHolder);
      }
    });

    d3.select("#" + eleSvg).on("mouseup", async function(event) {
      if (event.button == 0) {
        // console.log("mouseup", event.clientX, event.clientY);
        let foo = [
          lastPara.translate[0] + event.clientX - lastDownXY[0],
          lastPara.translate[1] + event.clientY - lastDownXY[1]
        ];
        lastPara = {
          width: lastPara.width,
          height: lastPara.height,
          range: lastPara.range,
          scale: lastPara.scale,
          translate: foo
        };
        //ドラッグ後のlastParaで範囲取得
        let bar = await GetViewportRange(lastPara);
        //その範囲に含まれる路線geo取得
        lastLineGeoMap = await getLineGeometry(geoLineJson, bar, null, null);
        //その範囲に含まれる駅geo取得
        lastStaGeoMap = await getStaGeometry(geoStaJson, bar, null, null, null);
        //表示
        d3.select("g").remove();
        // await appendSvg(lastLineGeoMap, lastPara, mouseEventsHolder);
        await appendSvg(
          lastLineGeoMap,
          lastStaGeoMap,
          lastPara,
          mouseEventsHolder
        );
        //ドラッグ終了
        isDragging = false;
      }
    });
  }

  //ズーム
  d3.select("#" + eleSvg).on("wheel", async function(event) {
    //前回表示データサイズ(px)
    let lastWidth =
      lastPara.scale * (lastPara.range[1][0] - lastPara.range[0][0]);
    let lastHeight =
      lastPara.scale * (lastPara.range[1][1] - lastPara.range[0][1]);
    //今回scale（event.deltaY +:縮小 -:拡大）
    let scale = lastPara.scale;
    if (event.deltaY >= 0) {
      scale *= 0.7;
    } else {
      scale *= 1.5;
    }
    //今回表示データサイズ(px)
    let thisWidth = scale * (lastPara.range[1][0] - lastPara.range[0][0]);
    let thisHeight = scale * (lastPara.range[1][1] - lastPara.range[0][1]);
    //前回との差(px)
    let diffWidth = lastWidth - thisWidth;
    let diffHeight = lastHeight - thisHeight;
    //前回表示中心からのoffset位置
    diffWidth *= (event.offsetX - lastPara.translate[0]) / lastWidth;
    diffHeight *= (event.offsetY - lastPara.translate[1]) / lastHeight;
    //ズーム後のlastPara保存
    let translate = [
      lastPara.translate[0] + diffWidth,
      lastPara.translate[1] + diffHeight
    ];
    lastPara = {
      width: lastPara.width,
      height: lastPara.height,
      range: lastPara.range,
      scale: scale,
      translate: translate
    };
    //ズーム後のlastParaで範囲取得
    let foo = await GetViewportRange(lastPara);
    //その範囲に含まれる路線geo取得
    lastLineGeoMap = await getLineGeometry(geoLineJson, foo, null, null);
    //その範囲に含まれる駅geo取得
    lastStaGeoMap = await getStaGeometry(geoStaJson, foo, null, null, null);
    //表示
    d3.select("g").remove();
    // await appendSvg(lastLineGeoMap, lastPara, mouseEventsHolder);
    await appendSvg(
      lastLineGeoMap,
      lastStaGeoMap,
      lastPara,
      mouseEventsHolder
    );
  });
}
