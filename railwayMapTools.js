//線幅
const STROKE_WIDTH_LINE = "1.5px"; //路線
const STROKE_WIDTH_LINE_SEL = "3px"; //路線選択
const STROKE_WIDTH_STA = "3px"; //駅
const STROKE_WIDTH_STA_SEL = "5px"; //駅選択
//色
const STROKE_COLOR_LINE = "gray"; //路線
const STROKE_COLOR_LINE_SEL_C = "blue"; //選択事業者路線
const STROKE_COLOR_LINE_SEL_L = "red"; //選択路線

// const STROKE_COLOR_STA = "black"; //駅
// const STROKE_COLOR_STA_SEL_C = "navy"; //選択事業者駅
// const STROKE_COLOR_STA_SEL_L = "purple"; //選択駅
// const STROKE_COLOR_STA = "black"; //駅
// const STROKE_COLOR_STA_SEL_C = "aqua"; //選択事業者駅
// const STROKE_COLOR_STA_SEL_L = "fuchsia"; //選択駅
const STROKE_COLOR_STA = "black"; //駅
const STROKE_COLOR_STA_SEL_C = "black"; //選択事業者駅
const STROKE_COLOR_STA_SEL_L = "black"; //選択駅

const FILL_COLOR_TEXT = "fuchsia"; //テキスト（路線名、駅名）
const FILL_COLOR_BACK = "white"; //テキスト背景

const SCALE_SHOW_STATION = 20000; //駅を表示するスケール値

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

//路線名map取得
async function getLineNameMap(geoJson) {
  //引数:geoJson
  //戻り値
  //CompanyNameMap:事業者名キーmap
  //LineNameMap:路線名キーmap
  //CompanyNoMap:事業者noキーMap
  //LineNoMap:路線noキーMap
  const funName = getLineNameMap.name;
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

//駅名map取得
async function getStaNameMap(geoJson) {
  //引数:geoJson
  //戻り値
  //CompanyNameMap:事業者名キーmap
  //LineNameMap:路線名キーmap
  //StaNameMap:駅名キーmap
  //CompanyNoMap:事業者noキーMap
  //LineNoMap:路線noキーMap
  //StaNoMap:駅noキーMap
  const funName = getStaNameMap.name;
  let cCount = 1; //事業者Noカウント 1-n
  let lCount = 1; //路線Noカウント 1-n
  let sCount = 1; //路線Noカウント 1-n
  let cNameMap = new Map(); //key:事業者名 val:事業者No(3桁)
  let lNameMap = new Map(); //key:事業者名_路線名 val:路線No(3桁)
  let sNameMap = new Map(); //key:事業者名_路線名_駅名 val:駅No(5桁)
  let cNoMap = new Map(); //key:事業者No(3桁) val:事業者名
  let lNoMap = new Map(); //key:路線No(3桁) val:事業者名_路線名
  let sNoMap = new Map(); //key:駅No(5桁) val:事業者名_路線名_駅名

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
    //駅map（駅Noは単独のseqNoで事業者No路線Noは含まれない）
    const sName =
      element.properties.N02_004 +
      "_" +
      element.properties.N02_003 +
      "_" +
      element.properties.N02_005;
    if (!sNameMap.has(sName)) {
      sNameMap.set(sName, sCount.toString().padStart(5, "0"));
      sCount++;
    }
  });

  cNameMap.forEach((value, key) => {
    cNoMap.set(value, key);
  });
  lNameMap.forEach((value, key) => {
    lNoMap.set(value, key);
  });
  sNameMap.forEach((value, key) => {
    sNoMap.set(value, key);
  });

  return {
    CompanyNameMap: cNameMap,
    LineNameMap: lNameMap,
    StaNameMap: sNameMap,
    CompanyNoMap: cNoMap,
    LineNoMap: lNoMap,
    StaNoMap: sNoMap
  };
}

//経度緯度範囲を指定して路線geometry取得
async function getLineGeometry(geoJson, range, companyName, lineName) {
  //引数:
  //geoJson
  //range:取得経度緯度範囲（nullは範囲選択無し）
  //  [[xmin, ymin], [xmax, ymax]](度)
  //companyName:事業者名（nullは事業者路線選択無し）
  //lineName:路線名（nullは路線選択無し）
  //※事業者名nullで路線名ありのパターンは無しとする
  //戻り値:
  //GeoMap:路線map
  const funName = getLineGeometry.name;
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
    } else if (
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

//経度緯度範囲を指定して駅geometry取得
async function getStaGeometry(geoJson, range, companyName, lineName, staName) {
  //引数:
  //geoJson
  //range:取得経度緯度範囲（nullは範囲選択無し）
  //  [[xmin, ymin], [xmax, ymax]](度)
  //companyName:事業者名（nullは事業者路線選択無し）
  //lineName:路線名（nullは路線選択無し）
  //staName:駅名（nullは駅選択無し）
  //※事業者名路線名nullで駅名ありのパターンは無しとする
  //戻り値:
  //GeoMap:駅map
  const funName = getStaGeometry.name;
  let gMap = new Map(); //key:事業者名_路線名_駅名 val:geoデータ[]

  //main loop
  geoJson.features.forEach(element => {
    //事業者、路線、駅チェック
    let isName = false;

    if (companyName == null && lineName == null && staName == null) {
      isName = true;
    } else if (
      companyName != null &&
      element.properties.N02_004 == companyName &&
      lineName == null &&
      staName == null
    ) {
      isName = true;
    } else if (
      companyName != null &&
      element.properties.N02_004 == companyName &&
      lineName != null &&
      element.properties.N02_003 == lineName &&
      staName == null
    ) {
      isName = true;
    } else if (
      companyName != null &&
      element.properties.N02_004 == companyName &&
      lineName != null &&
      element.properties.N02_003 == lineName &&
      staName != null &&
      element.properties.N02_005 == staName
    ) {
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
      const key =
        element.properties.N02_004 +
        "_" +
        element.properties.N02_003 +
        "_" +
        element.properties.N02_005;
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

async function appendSvg(lineGeoMap, staGeoMap, lastPara, meHolder) {
  //引数
  //lineGeoMap.Geo:事業者名_路線名 をキーとした路線map
  //staGeoMap.Geo:事業者名_路線名_駅名 をキーとした駅map
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

  //路線描画
  lineGeoMap.forEach((value, key) => {
    //クラス名
    //路線Noは事業者Noと被る部分があるので
    //路線クラスをkeyとする
    //例 事象者:c_001 路線:l_001_001
    let foo = key.toString().split("_");
    let cNo = meHolder.lineNameMap.CompanyNameMap.get(foo[0]);
    let lNo = meHolder.lineNameMap.LineNameMap.get(key);
    let cClass = "lc_" + cNo; //事業者クラス
    let lClass = "ll_" + cNo + "_" + lNo; //路線クラス
    //色
    let color = STROKE_COLOR_LINE;
    if (meHolder.lastSelName[1] != null && meHolder.lastSelName[1] == key) {
      color = STROKE_COLOR_LINE_SEL_L;
    } else if (
      meHolder.lastSelName[0] != null &&
      meHolder.lastSelName[0] == foo[0]
    ) {
      color = STROKE_COLOR_LINE_SEL_C;
    }
    g
      // .selectAll("." + cClass) //こちらではダメ
      .selectAll("." + lClass) //ここは1つでよいらしい...
      .data(value)
      .enter()
      .append("path")
      .attr("class", cClass + " " + lClass) //事業者と路線
      .attr("d", pathGenerator)
      .style("stroke", color)
      .style("stroke-width", STROKE_WIDTH_LINE)
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

  //駅描画（スケールがSCALE_SHOW_STATION以上の場合表示）
  // console.log(lastPara);
  if (lastPara.scale >= SCALE_SHOW_STATION) {
    staGeoMap.forEach((value, key) => {
      //クラス名は駅クラスとする
      //例 事象者:c_001 路線:l_001_001 駅:s_001_001_00001
      let foo = key.toString().split("_");
      let cNo = meHolder.staNameMap.CompanyNameMap.get(foo[0]);
      let lNo = meHolder.staNameMap.LineNameMap.get(foo[0] + "_" + foo[1]);
      let sNo = meHolder.staNameMap.StaNameMap.get(key);
      let cClass = "sc_" + cNo; //事業者クラス
      let lClass = "sl_" + cNo + "_" + lNo; //路線クラス
      let sClass = "ss_" + cNo + "_" + lNo + "_" + sNo; //駅クラス
      //色
      let color = STROKE_COLOR_STA;
      if (
        meHolder.lastSelName[1] != null &&
        meHolder.lastSelName[1] == foo[0] + "_" + foo[1]
      ) {
        color = STROKE_COLOR_STA_SEL_L;
      } else if (
        meHolder.lastSelName[0] != null &&
        meHolder.lastSelName[0] == foo[0]
      ) {
        color = STROKE_COLOR_STA_SEL_C;
      }
      g
        // .selectAll("." + cClass) //こちらではダメ
        // .selectAll("." + lClass) //こちらではダメ
        .selectAll("." + sClass) //ここは1つでよいらしい...
        .data(value)
        .enter()
        .append("path")
        .attr("class", cClass + " " + lClass + " " + sClass) //事業者,路線,駅
        .attr("d", pathGenerator)
        .style("stroke", color)
        .style("stroke-width", STROKE_WIDTH_STA)
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
  }

  //テキスト背景、テキスト
  g
    .append("rect")
    .attr("class", "back")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", 0)
    .style("visibility", "hidden")
    .style("fill", FILL_COLOR_BACK);
  g
    .append("text")
    .attr("class", "text")
    .attr("x", 0)
    .attr("y", 0)
    .style("visibility", "hidden")
    .attr("font-size", "16px")
    .attr("fill", FILL_COLOR_TEXT);
}

//マウスイベントホルダ
class MouseEventsHolder {
  constructor() {
    this.lineNameMap = null;
    this.staNameMap = null;
    this.lastSelName = [null, null];
    //内部変数
    this.lastXY = null; //マウスダウン時の座標
  }

  //マウスオーバ
  mouseoverHandler(d, classList) {
    //路線オーバー lc_000 ll_000_000
    //駅オーバー sc_000 sl_000_000 ss_000_000_00000

    //選択中青赤表示をグレーに戻す
    if (this.lastSelName[0] != null) {
      //路線（事業者青のみで路線赤も含まれる）
      let foo = this.lineNameMap.CompanyNameMap.get(this.lastSelName[0]);
      d3
        .selectAll("." + "lc_" + foo)
        .style("stroke", STROKE_COLOR_LINE)
        .style("stroke-width", STROKE_WIDTH_LINE);
      //駅（事業者青のみで路線赤も含まれる）
      let bar = this.staNameMap.CompanyNameMap.get(this.lastSelName[0]);
      d3
        .selectAll("." + "sc_" + bar)
        .style("stroke", STROKE_COLOR_STA)
        .style("stroke-width", STROKE_WIDTH_STA);
    }
    //オーバークラス青赤表示
    for (let i = 0; i < classList.length; i++) {
      let pf = classList[i].substring(0, 2);
      switch (pf) {
        case "lc": //路線事業者
          {
            //事業者路線
            d3
              .selectAll("." + classList[i])
              .style("stroke", STROKE_COLOR_LINE_SEL_C)
              .style("stroke-width", STROKE_WIDTH_LINE);
            //事業者駅
            let foo = classList[i].split("_");
            let bar = this.lineNameMap.CompanyNoMap.get(foo[1]);
            let baz = this.staNameMap.CompanyNameMap.get(bar);
            d3
              .selectAll("." + "sc_" + baz)
              .style("stroke", STROKE_COLOR_STA_SEL_C)
              .style("stroke-width", STROKE_WIDTH_STA);
          }
          break;
        case "sc": //駅事業者
          //事業者路線
          let foo = classList[i].split("_");
          let bar = this.staNameMap.CompanyNoMap.get(foo[1]);
          let baz = this.lineNameMap.CompanyNameMap.get(bar);
          d3
            .selectAll("." + "lc_" + baz)
            .style("stroke", STROKE_COLOR_LINE_SEL_C)
            .style("stroke-width", STROKE_WIDTH_LINE);
          //事業者駅
          d3
            .selectAll("." + classList[i])
            .style("stroke", STROKE_COLOR_STA_SEL_C)
            .style("stroke-width", STROKE_WIDTH_STA);
          break;
        case "ll":
          {
            {
              //路線路線
              d3
                .selectAll("." + classList[i])
                .style("stroke", STROKE_COLOR_LINE_SEL_L)
                .style("stroke-width", STROKE_WIDTH_LINE_SEL);
              //路線駅
              let foo = classList[i].split("_");
              let bar = this.lineNameMap.CompanyNoMap.get(foo[1]);
              let bar2 = this.staNameMap.CompanyNameMap.get(bar);
              let baz = this.lineNameMap.LineNoMap.get(foo[2]);
              let baz2 = this.staNameMap.LineNameMap.get(baz);
              d3
                .selectAll("." + "sl_" + bar2 + "_" + baz2)
                .style("stroke", STROKE_COLOR_STA_SEL_L)
                .style("stroke-width", STROKE_WIDTH_STA_SEL);
            }
            {
              //テキスト、事業者名路線名
              let xy = d3.pointer(d);
              let foo = classList[i].split("_");
              let bar = this.lineNameMap.LineNoMap.get(foo[2]).split("_");
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
          break;
        case "sl":
          {
            //路線路線
            let foo = classList[i].split("_");
            let bar = this.staNameMap.CompanyNoMap.get(foo[1]);
            let bar2 = this.lineNameMap.CompanyNameMap.get(bar);
            let baz = this.staNameMap.LineNoMap.get(foo[2]);
            let baz2 = this.lineNameMap.LineNameMap.get(baz);
            d3
              .selectAll("." + "ll_" + bar2 + "_" + baz2)
              .style("stroke", STROKE_COLOR_LINE_SEL_L)
              .style("stroke-width", STROKE_WIDTH_LINE_SEL);
            //路線駅
            d3
              .selectAll("." + classList[i])
              .style("stroke", STROKE_COLOR_STA_SEL_L)
              .style("stroke-width", STROKE_WIDTH_STA_SEL);
          }
          break;
        case "ss":
          {
            //駅駅の場合は駅名表示（色はllで済）
            //路線が違う駅が重なった場合、最後に描画した路線の駅名が表示される
            //駅名が同一の場合はよいが、違う場合は表示できない駅名が発生する
            let xy = d3.pointer(d);
            let foo = classList[i].split("_");
            let bar = this.staNameMap.StaNoMap.get(foo[3]).split("_");
            let baz = d3
              .selectAll("." + "text")
              .attr("x", xy[0] + 1)
              .attr("y", xy[1] + 1)
              .style("visibility", "visible")
              // .text(bar[0] + " " + bar[1] + " " + bar[2]);
              .text(bar[2]); //駅名のみ表示
            let bbox = baz.node().getBBox();
            d3
              .selectAll("." + "back")
              .attr("x", bbox.x)
              .attr("y", bbox.y)
              .attr("width", bbox.width)
              .attr("height", bbox.height)
              .style("visibility", "visible");
          }
          break;
      }
    }
  }

  //マウスアウト
  mouseoutHandler(d, classList) {
    // console.log("mouseout", this.lastSelName, classList);
    //オーバークラスグレー表示
    {
      for (let i = 0; i < classList.length; i++) {
        let pf = classList[i].substring(0, 2);
        switch (pf) {
          case "lc": //路線事業者（事業者のみで路線も含まれる）
            {
              //路線
              d3
                .selectAll("." + classList[i])
                .style("stroke", STROKE_COLOR_LINE)
                .style("stroke-width", STROKE_WIDTH_LINE);
              //駅
              let foo = classList[i].split("_");
              let bar = this.lineNameMap.CompanyNoMap.get(foo[1]);
              let baz = this.staNameMap.CompanyNameMap.get(bar);
              d3
                .selectAll("." + "sc_" + baz)
                .style("stroke", STROKE_COLOR_STA)
                .style("stroke-width", STROKE_WIDTH_STA);
            }
            break;
          case "sc": //駅事業者（事業者のみで路線も含まれる）
            {
              //路線
              let foo = classList[i].split("_");
              let bar = this.staNameMap.CompanyNoMap.get(foo[1]);
              let baz = this.lineNameMap.CompanyNameMap.get(bar);
              d3
                .selectAll("." + "lc_" + baz)
                .style("stroke", STROKE_COLOR_LINE)
                .style("stroke-width", STROKE_WIDTH_LINE);
              //駅
              d3
                .selectAll("." + classList[i])
                .style("stroke", STROKE_COLOR_STA)
                .style("stroke-width", STROKE_WIDTH_STA);
            }
            break;
        }
      }
      //テキスト非表示
      d3.selectAll("." + "text").style("visibility", "hidden");
      d3.selectAll("." + "back").style("visibility", "hidden");
    }
    //選択事業者を青赤表示
    if (this.lastSelName[0] != null) {
      //事業者路線
      let foo = this.lineNameMap.CompanyNameMap.get(this.lastSelName[0]);
      d3
        .selectAll("." + "lc_" + foo)
        .style("stroke", STROKE_COLOR_LINE_SEL_C)
        .style("stroke-width", STROKE_WIDTH_LINE);
      //事業者駅
      let foo2 = this.staNameMap.CompanyNameMap.get(this.lastSelName[0]);
      d3
        .selectAll("." + "sc_" + foo2)
        .style("stroke", STROKE_COLOR_STA_SEL_C)
        .style("stroke-width", STROKE_WIDTH_STA);
      //路線
      if (this.lastSelName[1] != null) {
        //路線路線
        {
          let bar = this.lineNameMap.LineNameMap.get(this.lastSelName[1]);
          d3
            .selectAll("." + "ll_" + foo + "_" + bar)
            .style("stroke", STROKE_COLOR_LINE_SEL_L)
            .style("stroke-width", STROKE_WIDTH_LINE);
        }
        //路線駅
        let bar2 = this.staNameMap.LineNameMap.get(this.lastSelName[1]);
        d3
          .selectAll("." + "sl_" + foo2 + "_" + bar2)
          .style("stroke", STROKE_COLOR_STA_SEL_L)
          .style("stroke-width", STROKE_WIDTH_STA);
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
            let bar = this.lineNameMap.CompanyNoMap.get(foo[1]);
            let baz = this.lineNameMap.LineNoMap.get(foo[2]);
            this.lastSelName = [bar, baz];
          }
        }
      }
    }
  }
}

//以下未使用
//rangeをradianからdegreeに変換
async function rangeFromRadianToDegree(range) {
  //[[xmin, ymin],[xmax, ymax]]
  let xmin = await radianToDegree(range[0][0]);
  let ymin = await radianToDegree(range[0][1]);
  let xmax = await radianToDegree(range[1][0]);
  let ymax = await radianToDegree(range[1][1]);

  return [[xmin, ymin], [xmax, ymax]];
}
//radianからdegreeに変換
async function radianToDegree(radian) {
  let degree = radian * (180 / Math.PI);
  return degree;
}
