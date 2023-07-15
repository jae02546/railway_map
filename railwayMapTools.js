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

//geoJsonからgeometry取得
async function getGeometry(geoJson, range, companyName, lineName) {
  //引数:
  //geoJson
  //range:取得経度緯度範囲（nullは範囲判断無し）
  //  [[xmin, ymin], [xmax, ymax]](度)
  //companyName:事業者名、nullは全事業者
  //lineName:路線名、nullは全路線
  //戻り値:geoJson.features.geometry[]
  //  All:range内の全路線（指定された事業者全路線を除く）
  //  Company:指定事業者全路線（指定された路線を除く）
  //  Line:指定路線
  const funName = getGeometry.name;
  // console.log(funName, range);
  let all = [];
  let company = [];
  let line = [];
  geoJson.features.forEach(element => {
    let foo = false;
    element.geometry.coordinates.forEach(element2 => {
      //経度緯度範囲チェック（単位は度）
      if (
        range == null ||
        (element2[0] >= range[0][0] &&
          element2[0] <= range[1][0] &&
          element2[1] >= range[0][1] &&
          element2[1] <= range[1][1])
      ) {
        foo = true;
        // break; //breakは使えないらしい
      }
    });
    if (foo) {
      //ここで全体をpushしてはダメか?
      //範囲外のパスも含まれてしまう
      if (
        companyName != null &&
        element.properties.N02_004 == companyName &&
        lineName != null &&
        element.properties.N02_003 == lineName
      ) {
        line.push(element.geometry);
      } else {
        if (companyName != null && element.properties.N02_004 == companyName) {
          company.push(element.geometry);
        } else {
          all.push(element.geometry);
        }
      }
    }
  });

  return {
    All: all,
    Company: company,
    Line: line
  };
}

//ビューポート経度緯度範囲取得
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

//geoデータ経度緯度範囲取得
async function getGeoRange(geo) {
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
  geo.forEach(element => {
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

// //ビューポート全体に表示するlastParaを取得する
// async function getLastPara(eleName, geo) {
//   //引数
//   //eleName:追加するエレメント
//   //geo:ビューポート全体に表示するgeoデータ
//   //戻り値 width,height,range,scale,translate
//   let funName = getLastPara.name;
//   //ビューポートに表示する地理的範囲（最小値最大値）取得
//   let geoRange = await getGeoRange(geo);
//   // console.log(funName, "getGeoRange", geoRange);
//   //D3.jsのsvg作成
//   let ds = document.getElementById(eleName);
//   let w = ds.offsetWidth;
//   let h = ds.offsetHeight;
//   // console.log(funName, "width:", w, "height:", h);
//   let svg = d3
//     .select("#" + eleName)
//     .append("svg")
//     .attr("width", w)
//     .attr("height", h);
//   let g = svg.append("g");
//   //プロジェクションを作成（初期化）
//   let projection = d3.geoMercator();
//   projection
//     .scale(1) // 一旦、スケールを1に設定
//     .translate([0, 0]); // 一旦、translateを0に設定
//   //地理的範囲をビューポートのピクセル範囲に変換
//   //[[xmin, ymin], [xmax, ymax]]
//   let r0 = projection(geoRange[0]); //最小値
//   let r1 = projection(geoRange[1]); //最大値
//   // console.log(funName, "r0 r1:", r0, r1);
//   //paddingを設定 (5%)
//   let padding = 0.05 * Math.min(w, h);
//   // let padding = 0;
//   //スケールとセンターを計算xz
//   let s =
//     1 /
//     Math.max(
//       (r1[0] - r0[0]) / (w - padding * 2),
//       (r0[1] - r1[1]) / (h - padding * 2)
//     );
//   let t = [(w - s * (r0[0] + r1[0])) / 2, (h - s * (r0[1] + r1[1])) / 2];
//   //戻り値
//   //width:ビューポート幅
//   //height:ビューポート高さ
//   //range:表示データ経度x緯度y最小値最大値(rad)
//   //      [[xmin, ymin], [xmax, ymax]]
//   //scale:表示幅(px)/表示角度(rad)
//   //translate:[x,y](px)ビューポート左下から見た経度0緯度0位置
//   return {
//     width: w,
//     height: h,
//     range: [r0, r1],
//     scale: s,
//     translate: t
//   };
// }

//ビューポート全体に表示するlastParaを取得する
async function getLastPara2(svg, geo) {
  //引数
  //eleName:追加するエレメント
  //geo:ビューポート全体に表示するgeoデータ
  //戻り値 width,height,range,scale,translate
  let funName = getLastPara2.name;
  //ビューポートに表示する地理的範囲（最小値最大値）取得
  let geoRange = await getGeoRange(geo);
  // console.log(funName, "getGeoRange", geoRange);
  //D3.jsのsvg作成
  // let ds = document.getElementById(eleName);
  let w = svg.offsetWidth;
  let h = svg.offsetHeight;
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

// //エレメント削除
// async function removeElement(eleName) {
//   //指定id配下のエレメントを全て削除する
//   let element = document.getElementById(eleName);
//   while (element.firstChild) {
//     element.removeChild(element.firstChild);
//   }
// }

//エレメント削除
async function removeElement2(element) {
  //指定エレメント配下のエレメントを全て削除する
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// //エレメント削除
// async function removeElement(eleName) {
//   //指定id配下のエレメントを全て削除する
//   let element = document.getElementById(eleName);
//   while (element.firstChild) {
//     element.removeChild(element.firstChild);
//   }
// }

//svg追加
async function appendSvg(eleName, lastPara, geo) {
  //引数
  //eleName:追加するエレメント
  //lastPara:
  //geo:geoデータ
  let funName = appendSvg.name;
  // console.log(funName, "", lastPara);
  //D3.jsのsvg作成
  let svg = d3
    .select("#" + eleName)
    .append("svg")
    .attr("width", lastPara.width)
    .attr("height", lastPara.height);
  let g = svg.append("g");
  //プロジェクションを作成（初期化）
  let projection = d3.geoMercator();
  // プロジェクションにスケールとtranslateを設定
  projection.scale(lastPara.scale).translate(lastPara.translate);
  // GeoPath ジェネレータを設定
  let pathGenerator = d3.geoPath().projection(projection);

  // SVG上に描画
  g
    .selectAll(".path-all")
    .data(geo.All)
    .enter()
    .append("path")
    .attr("class", "path-all")
    .attr("d", pathGenerator)
    // .style("stroke", "black")
    .style("stroke", "gray")
    .style("fill", "none");

  if (geo.Company != null) {
    g
      .selectAll(".path-company")
      .data(geo.Company)
      .enter()
      .append("path")
      .attr("class", "path-company")
      .attr("d", pathGenerator)
      .style("stroke", "blue")
      .style("fill", "none");
  }

  if (geo.Line != null) {
    g
      .selectAll(".path-line")
      .data(geo.Line)
      .enter()
      .append("path")
      .attr("class", "path-line")
      .attr("d", pathGenerator)
      .style("stroke", "red")
      .style("fill", "none");
  }
}

//svg追加
async function appendSvg2(lastPara, geo) {
  //引数
  //eleName:追加するエレメント
  //lastPara:
  //geo:geoデータ
  let funName = appendSvg.name;
  // console.log(funName, "", lastPara);
  //D3.jsのsvg作成
  // let svg = d3
  //   .select("#" + eleName)
  //   .append("svg")
  //   .attr("width", lastPara.width)
  //   .attr("height", lastPara.height);

  let g = d3.select("svg").append("g");
  //プロジェクションを作成（初期化）
  let projection = d3.geoMercator();
  // プロジェクションにスケールとtranslateを設定
  projection.scale(lastPara.scale).translate(lastPara.translate);
  // GeoPath ジェネレータを設定
  let pathGenerator = d3.geoPath().projection(projection);

  // SVG上に描画
  g
    .selectAll(".path-all")
    .data(geo.All)
    .enter()
    .append("path")
    .attr("class", "path-all")
    .attr("d", pathGenerator)
    // .style("stroke", "black")
    .style("stroke", "gray")
    .style("fill", "none");

  if (geo.Company != null) {
    g
      .selectAll(".path-company")
      .data(geo.Company)
      .enter()
      .append("path")
      .attr("class", "path-company")
      .attr("d", pathGenerator)
      .style("stroke", "blue")
      .style("fill", "none");
  }

  if (geo.Line != null) {
    g
      .selectAll(".path-line")
      .data(geo.Line)
      .enter()
      .append("path")
      .attr("class", "path-line")
      .attr("d", pathGenerator)
      .style("stroke", "red")
      .style("fill", "none");
  }
}

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
