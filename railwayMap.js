async function main() {
  const funName = main.name;
  //エレメント名
  const eleCompany = "listBoxCompany";
  const eleLine = "listBoxLine";
  const eleSvg = "divSvg";
  //事業者リストボックス、路線リストボックス、svg
  const lbCompany = document.getElementById(eleCompany);
  const lbLine = document.getElementById(eleLine);
  const svg = document.getElementById(eleSvg);
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
  {
    lastGeo = await getGeometry(geoJson, null, null, null);
    lastPara = await getLastPara(eleSvg, lastGeo.All);
    await removeElement(eleSvg);
    await appendSvg(eleSvg, lastPara, lastGeo);
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
        lastPara = await getLastPara(eleSvg, bar.Company);

        //これはうまくいく（これだとビューポート外も全路線が表示される）
        // await removeElement(eleSvg);
        // await appendSvg3(eleSvg, lastPara, bar.All, bar.Company, null);

        let baz = await GetViewportRange(lastPara);
        // let que = await getGeometry2(geoJson, baz, soCompany.text, null);
        lastGeo = await getGeometry(geoJson, baz, soCompany.text, null);
        await removeElement(eleSvg);
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
      await removeElement(eleSvg);
      await appendSvg(eleSvg, lastPara, lastGeo);
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
      lastGeo = await getGeometry(geoJson, foo, cText, lText);
      await removeElement(eleSvg);
      await appendSvg(eleSvg, lastPara, lastGeo);
    });
  }

  //マウスドラッグイベント（移動）
  {
    let isDragging = false; //true:ドラッグ中
    let lastDownXY = null; //マウスダウンxy座標
    let lastTouchXY = null; //タッチイベントxy座標

    //開始
    svg.addEventListener("mousedown", mousedownEvent);
    svg.addEventListener("touchstart", mousedownEvent);

    async function mousedownEvent(event) {
      // switch (event.button) {
      //   case 0: //左ボタン
      //     lastDownXY = [event.clientX, event.clientY];
      //     isDragging = true;
      //     break;
      //   case 1: //ホイールボタン
      //     break;
      //   case 2: //右ボタン
      //     break;
      //   default:
      //     break;
      // }
      if (event.type === "mousedown") {
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
        // alert("mousedown " + lastDownXY + " " + isDragging)
      } else if (event.type === "touchstart") {
        event.preventDefault(); // デフォルトのブラウザ動作を防ぐ
        lastDownXY = [
          Math.round(event.touches[0].clientX),
          Math.round(event.touches[0].clientY)
        ];
        lastTouchXY = [lastDownXY[0], lastDownXY[1]];
        isDragging = true;
        // alert("touchstart " + lastDownXY + " " + isDragging);
      }
    }

    // //左ボタン押下時の座標を保存、ドラッグ開始
    // svg.addEventListener("mousedown", event => {
    //   switch (event.button) {
    //     case 0: //左ボタン
    //       lastDownXY = [event.clientX, event.clientY];
    //       isDragging = true;
    //       break;
    //     case 1: //ホイールボタン
    //       break;
    //     case 2: //右ボタン
    //       break;
    //     default:
    //       break;
    //   }
    // });

    //ドラッグ
    svg.addEventListener("mousemove", mousemoveEvent);
    svg.addEventListener("touchmove", mousemoveEvent);

    async function mousemoveEvent(event) {
      if (isDragging) {
        let foo = null;
        if (event.type === "mousemove") {
          foo = [
            lastPara.translate[0] + event.clientX - lastDownXY[0],
            lastPara.translate[1] + event.clientY - lastDownXY[1]
          ];
          // alert("mousemove " + foo);
        } else if (event.type === "touchmove") {
          let barX = Math.round(event.touches[0].clientX);
          let barY = Math.round(event.touches[0].clientY);
          // if (lastTouchXY[0] != barX || lastTouchXY[1] != barY) {
          // if (
          //   Math.abs(lastTouchXY[0] - barX) >= 10 ||
          //   Math.abs(lastTouchXY[1] - barY) >= 10
          // ) {
          const tt =
            lastTouchXY[0] + ", " + barX + ", " + lastTouchXY[1] + ", " + barY;
          await testText(tt);
          // let svg = d3
          //   .select("body")
          //   .append("svg")
          //   .attr("width", 500)
          //   .attr("height", 100);
          // // textエレメントを作成してテキストを表示
          // svg
          //   .append("text")
          //   .attr("x", 50)
          //   .attr("y", 50)
          //   .attr("font-family", "sans-serif")
          //   .attr("font-size", "20px")
          //   .attr("fill", "black")
          //   .text(tt);

          lastTouchXY = [barX, barY];
          // foo = [
          //   lastPara.translate[0] + barX - lastDownXY[0],
          //   lastPara.translate[1] + barY - lastDownXY[1]
          // ];
          event.preventDefault(); // デフォルトのブラウザ動作を防ぐ
          // }
        }
        if (foo != null) {
          let bar = {
            width: lastPara.width,
            height: lastPara.height,
            range: lastPara.range,
            scale: lastPara.scale,
            translate: foo
          };
          await removeElement(eleSvg);
          await appendSvg(eleSvg, bar, lastGeo);
          // alert("touchmove2 " + foo);
        }
      }
    }

    // svg.addEventListener("mousemove", async function(event) {
    //   if (isDragging) {
    //     let foo = lastPara.scale;
    //     let bar = [
    //       lastPara.translate[0] + event.clientX - lastDownXY[0],
    //       lastPara.translate[1] + event.clientY - lastDownXY[1]
    //     ];
    //     let baz = {
    //       width: lastPara.width,
    //       height: lastPara.height,
    //       range: lastPara.range,
    //       scale: foo,
    //       translate: bar
    //     };
    //     await removeElement(eleSvg);
    //     await appendSvg(eleSvg, baz, lastGeo);
    //   }
    // });

    //ドラッグ終了
    svg.addEventListener("mouseup", mouseupEvent);
    svg.addEventListener("touchend", mouseupEvent);

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
              event.changedTouches[0].clientX -
              lastDownXY[0],
            lastPara.translate[1] +
              event.changedTouches[0].clientY -
              lastDownXY[1]
          ];
          // alert("touchend " + foo);
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
        await removeElement(eleSvg);
        await appendSvg(eleSvg, lastPara, lastGeo);
      }
      isDragging = false;
    }

    // svg.addEventListener("mouseup", async function(event) {
    //   //ビューポート外でmouseupしてもイベントは発生しない
    //   //ドラッグしたままビューポート外に出た等
    //   if (isDragging) {
    //     //mouseup時のtranslateを保存
    //     let foo = [
    //       lastPara.translate[0] + event.clientX - lastDownXY[0],
    //       lastPara.translate[1] + event.clientY - lastDownXY[1]
    //     ];
    //     lastPara = {
    //       width: lastPara.width,
    //       height: lastPara.height,
    //       range: lastPara.range,
    //       scale: lastPara.scale,
    //       translate: foo
    //     };

    //     let bar = await GetViewportRange(lastPara);
    //     let cText = soCompany != null ? soCompany.text : null;
    //     let lText = soLine != null ? soLine.text : null;
    //     lastGeo = await getGeometry(geoJson, bar, cText, lText);
    //     await removeElement(eleSvg);
    //     await appendSvg(eleSvg, lastPara, lastGeo);
    //   }
    //   isDragging = false;
    // });
  }
}
