//geojson形式ファイルの読込
async function getGeoJson(fileName) {
  //引数:fileName:geojson形式ファイル名
  //  同一フォルダに存在する場合はファイル名のみ
  //  ネット上に存在す場合はurl部分を含む
  //戻り値:geoJson
  const funName = getGeoJson.name;
  return fetch(fileName)
    .then(response => {
      // レスポンスがOKなら、結果をJSONとしてパース
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("エラー: " + response.status);
      }
    })
    .then(data => {
      // ここで取得したJSONデータを使って何かする
      // console.log(funName, "ok:", fileName);
      return data;
    })
    .catch(error => {
      // エラーが起きたらここで捕捉する
      console.log(funName, "エラーが発生しました:", error);
    });
}

//事業者名リスト取得
async function getCompanyList(geoJson) {
  //引数:geoJson
  //戻り値:事業者名set
  const funName = getCompanyList.name;
  let set = new Set();
  geoJson.features.forEach(element => {
    set.add(element.properties.N02_004);
  });
  // console.log(funName, "size:", set.size);
  return set;
}

//路線名リスト取得
async function getLineList(geoJson, companyName) {
  //引数:
  //geoJson
  //companyName:事業者名（nullの場合は全路線）
  //戻り値:路線名set
  const funName = getLineList.name;
  let set = new Set();
  geoJson.features.forEach(element => {
    if (null == companyName || element.properties.N02_004 == companyName) {
      set.add(element.properties.N02_003);
    }
  });
  // console.log(funName, "size:", set.size);
  return set;
}

//全事業者名全路線名map取得
async function getNameMap(geoJson) {
  //引数:geoJson
  //戻り値
  //CompanyNameMap:事業者名map
  //LineNameMap:路線名map
  //CompanyNoMap:事業者noMap
  //LineNoMap:路線noMap
  const funName = getNameMap.name;
  let cCount = 1; //事業者Noカウント 1-n
  let lCount = 1; //路線Noカウント 1-n
  let cNameMap = new Map(); //key:事業者名 val:事業者No(3桁)
  let lNameMap = new Map(); //key:事業者名_路線名 val:路線No(3桁)
  let cNoMap = new Map(); //key:事業者No(3桁) val:事業者名
  let lNoMap = new Map(); //key:路線No(3桁) val:事業者名_路線名

  //main loop
  geoJson.features.forEach(element => {
    //事業者map
    const cName = element.properties.N02_004;
    if (!cNameMap.has(cName)) {
      cNameMap.set(cName, cCount.toString().padStart(3, "0"));
      cCount++;
    }
    //路線map（路線Noは単独のseqNoで事業者Noは含まれない）
    const lName = element.properties.N02_004 + "_" + element.properties.N02_003;
    if (!lNameMap.has(lName)) {
      lNameMap.set(lName, lCount.toString().padStart(3, "0"));
      lCount++;
    }
  });

  cNameMap.forEach((value, key) => {
    cNoMap.set(value, key);
  });
  lNameMap.forEach((value, key) => {
    lNoMap.set(value, key);
  });

  return {
    CompanyNameMap: cNameMap,
    LineNameMap: lNameMap,
    CompanyNoMap: cNoMap,
    LineNoMap: lNoMap
  };
}

//経度緯度範囲を指定してgeometry取得
async function getGeometry(geoJson, range, companyName, lineName) {
  //引数:
  //geoJson
  //range:取得経度緯度範囲（nullは範囲選択無し）
  //  [[xmin, ymin], [xmax, ymax]](度)
  //companyName:事業者名（nullは事業者路線選択無し）
  //lineName:路線名（nullは路線選択無し）
  //※事業者名nullで路線名ありのパターンは無しとする
  //戻り値:
  //GeoMap:路線map
  const funName = getGeometry.name;
  let gMap = new Map(); //key:事業者名_路線名 val:geoデータ[]

  //main loop
  geoJson.features.forEach(element => {
    //事業者、路線チェック
    let isName = false;
    if (companyName == null && lineName == null) {
      isName = true;
    } else if (
      companyName != null &&
      element.properties.N02_004 == companyName &&
      lineName == null
    ) {
      isName = true;
    }
    if (
      companyName != null &&
      element.properties.N02_004 == companyName &&
      lineName != null &&
      element.properties.N02_003 == lineName
    ) {
      isName = true;
    }
    //経度緯度範囲チェック（単位は度）
    let isRange = false;
    if (isName) {
      element.geometry.coordinates.forEach(element2 => {
        if (
          range == null ||
          (element2[0] >= range[0][0] &&
            element2[0] <= range[1][0] &&
            element2[1] >= range[0][1] &&
            element2[1] <= range[1][1])
        ) {
          isRange = true;
          // break; //breakは使えないらしい
        }
      });
    }
    //対象データならmapに追加
    if (isName && isRange) {
      const key = element.properties.N02_004 + "_" + element.properties.N02_003;
      if (!gMap.has(key)) {
        gMap.set(key, []);
      }
      let geo = gMap.get(key);
      //geometry全体をpushしているので範囲外のパスも含まれる
      geo.push(element.geometry);
    }
  });

  return gMap;
}

//ビューポートの経度緯度範囲取得
async function GetViewportRange(lastPara) {
  //引数:lastPara
  //戻り値:ビューポート経度緯度範囲
  //  [[xmin, ymin],[xmax, ymax]]（度）
  const funName = GetViewportRange.name;
  let projection = d3
    .geoMercator()
    .scale(lastPara.scale)
    .translate(lastPara.translate);
  //ビューポート範囲を経度緯度に変換(度)
  let geoMin = projection.invert([0, 0]);
  let geoMax = projection.invert([lastPara.width, lastPara.height]);

  return [[geoMin[0], geoMax[1]], [geoMax[0], geoMin[1]]];
}

//geoデータの経度緯度範囲取得2
async function getGeoRange(geoMap) {
  //引数 geo:経度緯度範囲を取得するgeoデータ
  //戻り値:[[xmin, ymin], [xmax, ymax]]
  //戻り値:ビューポート経度緯度範囲
  //  [[xmin, ymin],[xmax, ymax]]（度）
  let funName = getGeoRange.name;
  //座標最小値最大値取得
  let xminArr = [];
  let xmaxArr = [];
  let yminArr = [];
  let ymaxArr = [];
  geoMap.forEach((value, key) => {
    value.forEach(element => {
      xminArr.push(
        d3.min(element.coordinates, function(d) {
          return d[0];
        })
      );
      xmaxArr.push(
        d3.max(element.coordinates, function(d) {
          return d[0];
        })
      );
      yminArr.push(
        d3.min(element.coordinates, function(d) {
          return d[1];
        })
      );
      ymaxArr.push(
        d3.max(element.coordinates, function(d) {
          return d[1];
        })
      );
    });
  });
  let xmin = d3.min(xminArr);
  let xmax = d3.max(xmaxArr);
  let ymin = d3.min(yminArr);
  let ymax = d3.max(ymaxArr);
  // console.log(funName, "xmin:", xmin);
  // console.log(funName, "xmax:", xmax);
  // console.log(funName, "ymin:", ymin);
  // console.log(funName, "ymax:", ymax);
  //戻り値（度）単位はjsonそのままなので度
  return [[xmin, ymin], [xmax, ymax]];
}

//geoデータをビューポート全体に表示するlastParaを取得
async function getLastPara(svgEle, geoMap) {
  //引数
  //svgEle:svgエレメント
  //geoMap:事業者No_路線Noをキーとしたgeoデータ
  //戻り値 width,height,range,scale,translate
  let funName = getLastPara.name;
  //ビューポートに表示する地理的範囲（最小値最大値）取得
  let geoRange = await getGeoRange(geoMap);
  //D3.jsのsvg作成
  // let ds = document.getElementById(eleName);
  let w = svgEle.offsetWidth;
  let h = svgEle.offsetHeight;
  // console.log(funName, "width:", w, "height:", h);
  // let svg = d3
  //   .select("#" + eleName)
  //   .append("svg")
  //   .attr("width", w)
  //   .attr("height", h);
  // let g = svg.append("g");
  //プロジェクションを作成（初期化）
  let projection = d3.geoMercator();
  projection
    .scale(1) // 一旦、スケールを1に設定
    .translate([0, 0]); // 一旦、translateを0に設定
  //地理的範囲をビューポートのピクセル範囲に変換
  //[[xmin, ymin], [xmax, ymax]]
  let r0 = projection(geoRange[0]); //最小値
  let r1 = projection(geoRange[1]); //最大値
  // console.log(funName, "r0 r1:", r0, r1);
  //paddingを設定 (5%)
  let padding = 0.05 * Math.min(w, h);
  // let padding = 0;
  //スケールとセンターを計算xz
  let s =
    1 /
    Math.max(
      (r1[0] - r0[0]) / (w - padding * 2),
      (r0[1] - r1[1]) / (h - padding * 2)
    );
  let t = [(w - s * (r0[0] + r1[0])) / 2, (h - s * (r0[1] + r1[1])) / 2];
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

//（未使用）エレメント削除
async function removeElement(element) {
  //指定エレメント配下のエレメントを全て削除する
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

//svg追加（geoデータを表示）
async function appendSvg(geoMap, lastPara, meHolder) {
  //引数
  //geoMap.Geo:事業者名_路線名 をキーとした路線map
  //lastPara:
  //meHolder:マウスイベントホルダ（nameMapとlastSelNameを含む）
  //lastSelName:選択中事業者名路線名[事業者名,路線名]nullは未選択
  let funName = appendSvg.name;
  let g = d3.select("svg").append("g");
  //プロジェクションを作成（初期化）
  let projection = d3.geoMercator();
  // プロジェクションにスケールとtranslateを設定
  projection.scale(lastPara.scale).translate(lastPara.translate);
  // GeoPath ジェネレータを設定
  let pathGenerator = d3.geoPath().projection(projection);
  //線太さ（MouseEventsHolderは別に定義）
  let strokeWidth = "1.5px";

  // SVG上に描画
  geoMap.forEach((value, key) => {
    // console.log(key, value);

    //クラス名
    //路線Noは事業者Noと被る部分があるので
    //路線クラスはkeyとする
    //例 事象者:c_001 路線:l_001_001
    let foo = key.toString().split("_");
    let cNo = meHolder.nameMap.CompanyNameMap.get(foo[0]);
    let lNo = meHolder.nameMap.LineNameMap.get(key);
    let cClass = "c_" + cNo; //事業者クラス
    let lClass = "l_" + cNo + "_" + lNo; //路線クラス
    // console.log(lastSelName);
    //色
    let color = "gray";
    if (meHolder.lastSelName[1] != null && meHolder.lastSelName[1] == key) {
      color = "red";
    } else if (
      meHolder.lastSelName[0] != null &&
      meHolder.lastSelName[0] == foo[0]
    ) {
      color = "blue";
    }

    g
      .selectAll("." + lClass) //ここは1つでよいらしい...
      .data(value)
      .enter()
      .append("path")
      .attr("class", cClass + " " + lClass) //事業者と路線
      .attr("d", pathGenerator)
      .style("stroke", color)
      .style("stroke-width", strokeWidth)
      .style("fill", "none")
      .on("mouseover", function(d) {
        meHolder.mouseoverHandler(d, this.classList);
      })
      .on("mouseout", function(d) {
        meHolder.mouseoutHandler(d, this.classList);
      })
      .on("mousedown", function(d) {
        meHolder.mousedownHandler(d, this.classList);
      })
      .on("mouseup", function(d) {
        meHolder.mouseupHandler(d, this.classList);
      });
  });
  //テキスト背景、テキスト
  g
    .append("rect")
    .attr("class", "back")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", 0)
    .style("visibility", "hidden")
    .style("fill", "white");
  g
    .append("text")
    .attr("class", "text")
    .attr("x", 0)
    .attr("y", 0)
    .style("visibility", "hidden")
    .attr("font-size", "16px")
    .attr("fill", "fuchsia");
}

//マウスイベントホルダ
class MouseEventsHolder {
  constructor() {
    this.nameMap = null;
    this.lastSelName = [null, null];
    //内部変数
    this.lastXY = null; //マウスダウン時の座標
    this.strokeWidth = "1.5px";
    this.strokeWidthSel = "3px";
  }

  //マウスオーバ
  mouseoverHandler(d, classList) {
    // console.log("mouseover", this.lastSelName, classList);
    //選択中事業者クラスグレー表示（路線は事業者に含まれるのでグレー表示不要）
    if (this.lastSelName[0] != null) {
      let foo = this.nameMap.CompanyNameMap.get(this.lastSelName[0]);
      d3
        .selectAll("." + "c_" + foo)
        .style("stroke", "gray")
        .style("stroke-width", this.strokeWidth);
    }
    //オーバークラス青赤表示
    for (let i = 0; i < classList.length; i++) {
      if (classList[i][0] === "c") {
        d3
          .selectAll("." + classList[i])
          .style("stroke", "blue")
          .style("stroke-width", this.strokeWidth);
      } else {
        d3
          .selectAll("." + classList[i])
          .style("stroke", "red")
          .style("stroke-width", this.strokeWidthSel);
        //事業者名路線名表示
        let xy = d3.pointer(d);
        let foo = classList[i].split("_");
        let bar = this.nameMap.LineNoMap.get(foo[2]).split("_");
        let baz = d3
          .selectAll("." + "text")
          .attr("x", xy[0] + 1)
          .attr("y", xy[1] + 1)
          .style("visibility", "visible")
          .text(bar[0] + " " + bar[1]);
        let bbox = baz.node().getBBox();
        d3
          .selectAll("." + "back")
          .attr("x", bbox.x)
          .attr("y", bbox.y)
          .attr("width", bbox.width)
          .attr("height", bbox.height)
          .style("visibility", "visible");
      }
    }
  }

  //マウスアウト
  mouseoutHandler(d, classList) {
    // console.log("mouseout", this.lastSelName, classList);
    //オーバークラスグレー表示（路線は事業者に含まれるのでグレー表示不要）
    for (let i = 0; i < classList.length; i++) {
      if (classList[i][0] === "c") {
        d3
          .selectAll("." + classList[i])
          .style("stroke", "gray")
          .style("stroke-width", this.strokeWidth);
      }
      //テキスト非表示
      if (classList[i][0] === "l") {
        d3.selectAll("." + "text").style("visibility", "hidden");
        d3.selectAll("." + "back").style("visibility", "hidden");
      }
    }
    //選択事業者クラス青表示
    if (this.lastSelName[0] != null) {
      let foo = this.nameMap.CompanyNameMap.get(this.lastSelName[0]);
      d3
        .selectAll("." + "c_" + foo)
        .style("stroke", "blue")
        .style("stroke-width", this.strokeWidth);
      //選択路線クラス赤表示
      if (this.lastSelName[1] != null) {
        let bar = this.nameMap.LineNameMap.get(this.lastSelName[1]);
        d3
          .selectAll("." + "l_" + foo + "_" + bar)
          .style("stroke", "red")
          .style("stroke-width", this.strokeWidth);
      }
    }
  }

  //マウスダウン
  mousedownHandler(d, classList) {
    // console.log("mousedown", this.lastSelName);
    //右ボタンなら座標保存
    if (d.button == 0) {
      this.lastXY = [d.clientX, d.clientY];
    }
  }

  //マウスアップ
  mouseupHandler(d, classList) {
    // console.log("mouseup", this.lastSelName, classList);
    //右ボタンで前回と同じ座標なら事業者、路線選択
    //既に選択されていた場合は上書きとなる
    if (d.button == 0) {
      if (this.lastXY[0] == d.clientX && this.lastXY[1] == d.clientY) {
        for (let i = 0; i < classList.length; i++) {
          if (classList[i][0] === "l") {
            let foo = classList[i].split("_");
            let bar = this.nameMap.CompanyNoMap.get(foo[1]);
            let baz = this.nameMap.LineNoMap.get(foo[2]);
            this.lastSelName = [bar, baz];
          }
        }
      }
    }
  }
}

//以下未使用
//rangeをradianからDegreeに変換
async function rangeFromRadianToDegree(range) {
  //[[xmin, ymin],[xmax, ymax]]
  let xmin = await radianToDegree(range[0][0]);
  let ymin = await radianToDegree(range[0][1]);
  let xmax = await radianToDegree(range[1][0]);
  let ymax = await radianToDegree(range[1][1]);

  return [[xmin, ymin], [xmax, ymax]];
}
//radianからDegreeに変換
async function radianToDegree(radian) {
  let degree = radian * (180 / Math.PI);
  return degree;
}
