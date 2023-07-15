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
  //現在のgeoデータ
  let lastGeo = null;
  //現在のパラメータ（幅、高さ、経度緯度範囲、スケール、経度0緯度0位置）
  let lastPara = null;

  //json取得
  // const fileName = "test_N02-21_RailroadSection.geojson";
  const fileName = "N02-21_RailroadSection.geojson";
  let geoJson = await getGeoJson(fileName);

  //全事業者全路線表示（初期表示）
  // {
  //   lastGeo = await getGeometry(geoJson, null, null, null);
  //   // lastPara = await getLastPara(eleSvg, lastGeo.All);
  //   lastPara = await getLastPara2(svg, lastGeo.All);
  //   // await removeElement(eleSvg);
  //   await removeElement2(svg);
  //   await appendSvg(eleSvg, lastPara, lastGeo);
  //   // await appendSvg2(svg, lastPara, lastGeo);
  // }
  //全事業者全路線表示（初期表示）
  {
    lastGeo = await getGeometry(geoJson, null, null, null);
    // lastPara = await getLastPara(eleSvg, lastGeo.All);
    lastPara = await getLastPara2(divSvg, lastGeo.All);
    d3
      .select("#" + eleSvg)
      .append("svg")
      .attr("width", lastPara.width)
      .attr("height", lastPara.height);
    d3.select("g").remove();
    await appendSvg2(lastPara, lastGeo);
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
        let bar = await getGeometry(geoJson, null, soCompany.text, null);
        // lastPara = await getLastPara(eleSvg, bar.Company);
        lastPara = await getLastPara2(divSvg, bar.Company);

        //これはうまくいく（これだとビューポート外も全路線が表示される）
        // await removeElement(eleSvg);
        // await appendSvg3(eleSvg, lastPara, bar.All, bar.Company, null);

        let baz = await GetViewportRange(lastPara);
        // let que = await getGeometry2(geoJson, baz, soCompany.text, null);
        lastGeo = await getGeometry(geoJson, baz, soCompany.text, null);
        // await removeElement(eleSvg);
        await removeElement2(divSvg);
        await appendSvg(eleSvg, lastPara, lastGeo);
      }
    }
  }

  //路線リストボックスイベント
  {
    lbLine.addEventListener("change", async function() {
      soLine = this.options[this.selectedIndex];
      let baz = await GetViewportRange(lastPara);
      lastGeo = await getGeometry(geoJson, baz, soCompany.text, soLine.text);
      // await removeElement(eleSvg);
      await removeElement2(divSvg);
      await appendSvg(eleSvg, lastPara, lastGeo);
    });
  }

  //ドラッグイベント
  {
    let isDragging = false; //true:ドラッグ中
    let lastDownXY = null; //マウスダウンxy座標
    let lastTouchXY = null; //タッチイベントxy座標

    d3.select("#" + eleSvg).on("mousedown", async function(event) {
      console.log("mousedown", event.clientX, event.clientY);
      if (event.button == 0) {
        lastDownXY = [event.clientX, event.clientY];
        isDragging = true;
      }
    });

    d3.select("#" + eleSvg).on("touchstart", async function(event) {
      console.log(
        "touchstart",
        event.touches[0].clientX,
        event.touches[0].clientY
      );
      event.preventDefault(); // デフォルトのブラウザ動作を防ぐ
      var x = event.touches[0].clientX;
      var y = event.touches[0].clientY;
    });

    d3.select("#" + eleSvg).on("mousemove", async function(event) {
      if (isDragging) {
        console.log("mousemove", event.clientX, event.clientY);
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
        await appendSvg2(bar, lastGeo);
      }
    });

    // d3.select("#" + eleSvg).on("touchmove", async function(event) {
    //   if (isDragging) {
    //     console.log("touchmove", event.clientX, event.clientY);
    //     event.preventDefault(); // デフォルトのブラウザ動作を防ぐ
    //     let barX = Math.round(event.touches[0].clientX);
    //     let barY = Math.round(event.touches[0].clientY);
    //     if (lastTouchXY[0] != barX || lastTouchXY[1] != barY) {
    //       lastTouchXY = [barX, barY];
    //       let foo = [
    //         lastPara.translate[0] + barX - lastDownXY[0],
    //         lastPara.translate[1] + barY - lastDownXY[1]
    //       ];
    //       let bar = {
    //         width: lastPara.width,
    //         height: lastPara.height,
    //         range: lastPara.range,
    //         scale: lastPara.scale,
    //         translate: foo
    //       };
    //       d3.select("g").remove();
    //       await appendSvg2(bar, lastGeo);
    //     }
    //   }
    // });

    d3.select("#" + eleSvg).on("mouseup", async function(event) {
      console.log("mouseup", event.clientX, event.clientY);
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
      let bar = await GetViewportRange(lastPara);
      let cText = soCompany != null ? soCompany.text : null;
      let lText = soLine != null ? soLine.text : null;
      lastGeo = await getGeometry(geoJson, bar, cText, lText);
      d3.select("g").remove();
      await appendSvg2(lastPara, lastGeo);
      isDragging = false;
    });

    d3.select("#" + eleSvg).on("touchend", async function(event) {
      console.log("touchend", event.clientX, event.clientY);
      event.preventDefault(); // デフォルトのブラウザ動作を防ぐ
      let foo = [
        lastPara.translate[0] +
          Math.round(event.changedTouches[0].clientX) -
          lastDownXY[0],
        lastPara.translate[1] +
          Math.round(event.changedTouches[0].clientY) -
          lastDownXY[1]
      ];
      lastPara = {
        width: lastPara.width,
        height: lastPara.height,
        range: lastPara.range,
        scale: lastPara.scale,
        translate: foo
      };
      let bar = await GetViewportRange(lastPara);
      let cText = soCompany != null ? soCompany.text : null;
      let lText = soLine != null ? soLine.text : null;
      lastGeo = await getGeometry(geoJson, bar, cText, lText);
      d3.select("g").remove();
      await appendSvg2(lastPara, lastGeo);
      isDragging = false;
    });
  }

  d3.select("#" + eleSvg).on("wheel", async function(event) {
    //前回表示データサイズ(px)
    let lastWidth =
      lastPara.scale * (lastPara.range[1][0] - lastPara.range[0][0]);
    let lastHeight =
      lastPara.scale * (lastPara.range[1][1] - lastPara.range[0][1]);
    //今回scale（event.deltaY +:縮小 -:拡大）
    let scale = lastPara.scale;
    if (event.deltaY >= 0) {
      scale *= 0.8;
    } else {
      scale *= 1.2;
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
    lastGeo = await getGeometry(geoJson, foo, cText, lText);
    d3.select("g").remove();
    await appendSvg2(lastPara, lastGeo);
  });

  //マウスドラッグイベント（移動）
  {
    // let isDragging = false; //true:ドラッグ中
    // let lastDownXY = null; //マウスダウンxy座標
    // let lastTouchXY = null; //タッチイベントxy座標

    //開始
    // svg.addEventListener("mousedown", mousedownEvent);
    // svg.addEventListener("touchstart", mousedownEvent);

    async function mousedownEvent(event) {
      if (event.type === "mousedown") {
        if (event.button == 0) {
          lastDownXY = [event.clientX, event.clientY];
          isDragging = true;
        }
      } else if (event.type === "touchstart") {
        event.preventDefault(); // デフォルトのブラウザ動作を防ぐ
        lastDownXY = [
          Math.round(event.touches[0].clientX),
          Math.round(event.touches[0].clientY)
        ];
        lastTouchXY = [lastDownXY[0], lastDownXY[1]];
        isDragging = true;

        console.log(
          funName,
          "touchstart 21",
          event.touches[0].clientX,
          event.touches[0].clientY
        );
      }
    }

    //移動
    // svg.addEventListener("mousemove", mousemoveEvent);
    // svg.addEventListener("touchmove", mousemoveEvent);

    async function mousemoveEvent(event) {
      if (isDragging) {
        let foo = null;
        if (event.type === "mousemove") {
          console.log(funName, "mousemove", event.clientX, event.clientY);

          foo = [
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
          // removeElement(eleSvg);
          await removeElement2(divSvg);
          appendSvg(eleSvg, bar, lastGeo);
        } else if (event.type === "touchmove") {
          event.preventDefault(); // デフォルトのブラウザ動作を防ぐ
          let barX = Math.round(event.touches[0].clientX);
          let barY = Math.round(event.touches[0].clientY);
          if (lastTouchXY[0] != barX || lastTouchXY[1] != barY) {
            lastTouchXY = [barX, barY];
            foo = [
              lastPara.translate[0] + barX - lastDownXY[0],
              lastPara.translate[1] + barY - lastDownXY[1]
            ];
            let bar = {
              width: lastPara.width,
              height: lastPara.height,
              range: lastPara.range,
              scale: lastPara.scale,
              translate: foo
            };
            // removeElement(eleSvg);
            await removeElement2(divSvg);
            appendSvg2(eleSvg, bar, lastGeo);

            // console.log(
            //   funName,
            //   "touchmove 22",
            //   event.touches[0].clientX,
            //   event.touches[0].clientY
            // );
          }
        }
        // if (foo != null) {
        //   let bar = {
        //     width: lastPara.width,
        //     height: lastPara.height,
        //     range: lastPara.range,
        //     scale: lastPara.scale,
        //     translate: foo
        //   };
        //   removeElement(eleSvg);
        //   appendSvg(eleSvg, bar, lastGeo);
        // }
      }
    }

    //終了
    // svg.addEventListener("mouseup", mouseupEvent);
    // svg.addEventListener("touchend", mouseupEvent);
    // svg.addEventListener("touchcancel", function(e) {
    //   console.log(
    //     funName,
    //     "touchcancel 21"
    //     // e.changedTouches[0].clientX,
    //     // e.changedTouches[0].clientY
    //   );
    // });

    async function mouseupEvent(event) {
      //ビューポート外でmouseupしてもイベントは発生しない
      //ドラッグしたままビューポート外に出た等
      if (isDragging) {
        //mouseup時のtranslateを保存
        let foo = null;
        if (event.type === "mouseup") {
          foo = [
            lastPara.translate[0] + event.clientX - lastDownXY[0],
            lastPara.translate[1] + event.clientY - lastDownXY[1]
          ];
          // alert("mouseup " + foo);
        } else if (event.type === "touchend") {
          event.preventDefault(); // デフォルトのブラウザ動作を防ぐ
          foo = [
            lastPara.translate[0] +
              Math.round(event.changedTouches[0].clientX) -
              lastDownXY[0],
            lastPara.translate[1] +
              Math.round(event.changedTouches[0].clientY) -
              lastDownXY[1]
          ];
          console.log(
            funName,
            "touchend 21",
            event.changedTouches[0].clientX,
            event.changedTouches[0].clientY
          );
        }
        lastPara = {
          width: lastPara.width,
          height: lastPara.height,
          range: lastPara.range,
          scale: lastPara.scale,
          translate: foo
        };

        let bar = await GetViewportRange(lastPara);
        let cText = soCompany != null ? soCompany.text : null;
        let lText = soLine != null ? soLine.text : null;
        lastGeo = await getGeometry(geoJson, bar, cText, lText);
        // await removeElement(eleSvg);
        await removeElement2(divSvg);
        await appendSvg(eleSvg, lastPara, lastGeo);
      }
      isDragging = false;
    }
  }
}
