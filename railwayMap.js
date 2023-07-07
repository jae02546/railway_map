async function main() {
  const funName = main.name;
  //エレメント名
  const eleCompany = "listBoxCompany";
  const eleLine = "listBoxLine";
  const eleSvg = "divSvg";
  //事業者リストボックス、路線リストボックス、svg
  let lbCompany = document.getElementById(eleCompany);
  let lbLine = document.getElementById(eleLine);
  let svg = document.getElementById(eleSvg);
  //選択中事業者オプション、選択中路線オプション
  let soCompany = null;
  let soLine = null;
  //表示中のgeoデータ
  let lastGeo = null;
  // let lastGeoAll = null;
  // let lastGeoCompany = null;
  // let lastGeoLine = null;
  //geoデータ最小値最大値、スケール、経度0緯度0位置
  let lastPara = null;

  //json取得
  // const fileName = "test_N02-21_RailroadSection.geojson";
  const fileName = "N02-21_RailroadSection.geojson";
  let geoJson = await getGeoJson(fileName);

  //全事業者全路線表示（初期表示）
  {
    // lastGeoAll = await getGeometry(geoJson, null, null);
    // let foo = await getGeometry2(geoJson, null, null, null);
    // console.log(funName, "getGeometry2", foo);
    // lastGeoAll = foo.All;
    lastGeo = await getGeometry2(geoJson, null, null, null);
    lastPara = await getLastPara(eleSvg, lastGeo.All);
    // console.log(funName, lastPara);
    await removeElement(eleSvg);
    // await appendSvg3(eleSvg, lastPara, lastGeoAll, null, null);
    await appendSvg3(eleSvg, lastPara, lastGeo);

    // lastPara = await appendSvg(eleSvg, lastGeoAll, null, null);
    // console.log(funName, lastPara);
  }

  //事業者リストボックス事業者名追加
  {
    let foo = await getCompanyList(geoJson);
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
      let foo = await getLineList(geoJson, soCompany.text);
      // console.log(showMain.name, "companyLineList:", soCompany.text, lineList);
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
        //選択された事業者をビューポート全体に表示するlastPara取得
        let bar = await getGeometry2(geoJson, null, soCompany.text, null);
        lastPara = await getLastPara(eleSvg, bar.Company);

        //これはうまくいく（これだとビューポート外も全路線が表示される）
        // await removeElement(eleSvg);
        // await appendSvg3(eleSvg, lastPara, bar.All, bar.Company, null);

        let baz = await GetViewportRange(lastPara);
        // let que = await getGeometry2(geoJson, baz, soCompany.text, null);
        lastGeo = await getGeometry2(geoJson, baz, soCompany.text, null);
        // lastGeoAll = que.All;
        // lastGeoCompany = que.Company;
        // lastGeoLine = que.Line;
        await removeElement(eleSvg);
        await appendSvg3(eleSvg, lastPara, lastGeo);
      }
    }
  }

  //路線リストボックスイベント
  {
    lbLine.addEventListener("change", async function() {
      soLine = this.options[this.selectedIndex];
      let baz = await GetViewportRange(lastPara);
      lastGeo = await getGeometry2(geoJson, baz, soCompany.text, soLine.text);
      // let que = await getGeometry2(geoJson, baz, soCompany.text, soLine.text);
      // lastGeoAll = que.All;
      // lastGeoCompany = que.Company;
      // lastGeoLine = que.Line;
      await removeElement(eleSvg);
      await appendSvg3(eleSvg, lastPara, lastGeo);
    });
  }

  //マウスホイールイベント（ズーム）
  {
    svg.addEventListener("wheel", async function(event) {
      //前回表示データサイズ(px)
      let lastWidth =
        lastPara.scale * (lastPara.range[1][0] - lastPara.range[0][0]);
      let lastHeight =
        lastPara.scale * (lastPara.range[1][1] - lastPara.range[0][1]);
      //今回scale（event.deltaY +:縮小 -:拡大）
      // console.log(funName, "event.deltaY", event.deltaY);
      let scale = lastPara.scale;
      if (event.deltaY >= 0) {
        scale *= 0.95;
      } else {
        scale *= 1.05;
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

      let foo = await GetViewportRange(lastPara);
      let cText = soCompany != null ? soCompany.text : null;
      let lText = soLine != null ? soLine.text : null;
      lastGeo = await getGeometry2(geoJson, foo, cText, lText);
      await removeElement(eleSvg);
      await appendSvg3(eleSvg, lastPara, lastGeo);
    });
  }

  //マウスドラッグイベント（移動）
  {
    let lastDownXY = null; //マウスダウンxy座標
    let isDragging = false; //true:ドラッグ中

    //左ボタン押下時の座標を保存、ドラッグ開始
    svg.addEventListener("mousedown", event => {
      switch (event.button) {
        case 0: //左ボタン
          lastDownXY = [event.clientX, event.clientY];
          isDragging = true;
          break;
        case 1: //ホイールボタン
          break;
        case 2: //右ボタン
          break;
        default:
          break;
      }
    });

    //ドラッグ
    svg.addEventListener("mousemove", async function(event) {
      if (isDragging) {
        let foo = lastPara.scale;
        let bar = [
          lastPara.translate[0] + event.clientX - lastDownXY[0],
          lastPara.translate[1] + event.clientY - lastDownXY[1]
        ];
        let baz = {
          width: lastPara.width,
          height: lastPara.height,
          range: lastPara.range,
          scale: foo,
          translate: bar
        };
        await removeElement(eleSvg);
        await appendSvg3(eleSvg, baz, lastGeo);
      }
    });

    //ドラッグ終了
    svg.addEventListener("mouseup", async function(event) {
      //ビューポート外でmouseupしてもイベントは発生しない
      //ドラッグしたままビューポート外に出た等
      if (isDragging) {
        //mouseup時のtranslateを保存
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

        let foo2 = await GetViewportRange(lastPara);
        let cText = soCompany != null ? soCompany.text : null;
        let lText = soLine != null ? soLine.text : null;
        lastGeo = await getGeometry2(geoJson, foo2, cText, lText);
        await removeElement(eleSvg);
        await appendSvg3(eleSvg, lastPara, lastGeo);
      }
      isDragging = false;
    });
  }
}

//geoJsonからgeometry取得
async function getGeometry(geoJson, companyName, lineName) {
  //引数:
  //geoJson
  //companyName:事業者名、nullは全事業者
  //lineName:路線名、nullは全路線
  //戻り値:geoJson.features.geometry[]
  let result = [];
  geoJson.features.forEach(element => {
    if (
      (null == lineName || element.properties.N02_003 == lineName) &&
      (null == companyName || element.properties.N02_004 == companyName)
    ) {
      result.push(element.geometry);
    }
  });
  //   console.log(getGeometry.name, "length:", result.length);
  return result;
}

//svg追加
async function appendSvg(eleName, geoAll, geoCompany, geoLine) {
  //引数
  //eleName:追加するエレメント
  //geoAll:geoデータ（scaleとtranslateの計算に使用、黒）
  //geoCompany:事業者geoデータ（nullの場合は描画しない、青）
  //geoLine:路線geoデータ（nullの場合は描画しない、赤）
  //戻り値 width,height,range,scale,translate
  let funName = appendSvg.name;
  //ビューポートに表示する地理的範囲（最小値最大値）取得
  let geoRange = await getGeoRange(geoAll);
  // console.log(appendSvg.name, "geoRange:", geoRange);
  //D3.jsのsvg作成
  let ds = document.getElementById(eleName);
  let w = ds.offsetWidth;
  let h = ds.offsetHeight;
  console.log(funName, "width:", w, "height:", h);
  let svg = d3
    .select("#" + eleName)
    .append("svg")
    .attr("width", w)
    .attr("height", h);
  let g = svg.append("g");
  //プロジェクションを作成（初期化）
  let projection = d3.geoMercator();
  projection
    .scale(1) // 一旦、スケールを1に設定
    .translate([0, 0]); // 一旦、translateを0に設定
  //地理的範囲をビューポートのピクセル範囲に変換
  //[[xmin, ymin], [xmax, ymax]]
  let r0 = projection(geoRange[0]); //最小値
  let r1 = projection(geoRange[1]); //最大値
  console.log(appendSvg.name, "r0 r1:", r0, r1);
  //paddingを設定 (5%)
  // var padding = 0.05 * Math.min(w, h);
  let padding = 0;
  //スケールとセンターを計算xz
  let s =
    1 /
    Math.max(
      (r1[0] - r0[0]) / (w - padding * 2),
      (r0[1] - r1[1]) / (h - padding * 2)
    );
  let t = [(w - s * (r0[0] + r1[0])) / 2, (h - s * (r0[1] + r1[1])) / 2];
  console.log(appendSvg.name, "scale:", s);
  console.log(appendSvg.name, "translate:", t);

  // プロジェクションにスケールとtranslateを設定
  projection.scale(s).translate(t);
  // GeoPath ジェネレータを設定
  let pathGenerator = d3.geoPath().projection(projection);

  //SVG上に描画
  g
    .selectAll(".path-all")
    .data(geoAll)
    .enter()
    .append("path")
    .attr("class", "path-all")
    .attr("d", pathGenerator)
    .style("stroke", "black") // 線の色
    .style("fill", "none"); // 塗りつぶしなし

  if (geoCompany != null) {
    g
      .selectAll(".path-company")
      .data(geoCompany)
      .enter()
      .append("path")
      .attr("class", "path-company")
      .attr("d", pathGenerator)
      .style("stroke", "blue") // 線の色
      .style("fill", "none"); // 塗りつぶしなし
  }

  if (geoLine != null) {
    g
      .selectAll(".path-line")
      .data(geoLine)
      .enter()
      .append("path")
      .attr("class", "path-line")
      .attr("d", pathGenerator)
      .style("stroke", "red") // 線の色
      .style("fill", "none"); // 塗りつぶしなし
  }

  //戻り値
  //width:ビューポート幅
  //height:ビューポート高さ
  //range:表示データ経度x緯度y最小値最大値(rad)
  //      [[xmin, ymin], [xmax, ymax]]
  //scale:表示幅(px)/表示角度(rad)
  //translate:[x,y](px)ビューポート左下から見た経度0緯度0位置
  return {
    width: w,
    height: h,
    range: [r0, r1],
    scale: s,
    translate: t
  };
}

//svg追加2
async function appendSvg2(geoPath, para, eleName) {
  //引数
  //geoPath:座標データ（描画）
  //para.scale:スケール
  //para.translate:表示中心
  //eleName:追加するエレメント
  let funName = appendSvg2.name;
  //D3.jsのsvg作成
  let ds = document.getElementById(eleName);
  let w = ds.offsetWidth;
  let h = ds.offsetHeight;
  // console.log(funName, "width:", w, "height:", h);
  var svg = d3
    .select("#" + eleName)
    .append("svg")
    .attr("width", w)
    .attr("height", h);
  var g = svg.append("g");
  //プロジェクションを作成（初期化）
  var projection = d3.geoMercator();
  // プロジェクションにスケールとtranslateを設定
  projection.scale(para.scale).translate(para.translate);
  // GeoPath ジェネレータを設定
  var pathGenerator = d3.geoPath().projection(projection);
  //SVG上に描画
  g
    .selectAll("path")
    .data(geoPath)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .style("stroke", "black") // 線の色
    .style("fill", "none"); // 塗りつぶしなし
}
