# VRM Three.js AR Sample

VRM ファイルを WebAR で表示するサンプルです。

スマホのブラウザさえあればコンテンツにアクセスできるので、AR アプリのボトルネックになりがちなインストールの手間を省けるのが利点です。

<img src="https://raw.githubusercontent.com/t-takasaka/vrm-three-ar/master/demo.gif">

## デモ

スマートフォンで下記のQRコードを読み取るか、ウェブカメラの付いたPCで[こちら](https://t-takasaka.github.io/vrm-three-ar/)にアクセスしてください。

ページの表示後、再度、QRコードにカメラを向けるとモデルが表示されます。

（読み込みにちょっと時間がかかります）

<img src="https://raw.githubusercontent.com/t-takasaka/vrm-three-ar/master/assets/marker.png" width="300px">

## インストールするには？

1. [トップページ](https://github.com/t-takasaka/vrm-three-ar) の右上にある "Clone or download" ボタンを押します

2. ポップアップが表示されるので、"Download ZIP" ボタンを押します

3. ダウンロードした zip ファイルを解凍します

4. 解凍した vrm-three-ar-master フォルダをウェブサーバーにアップロードします

5. アップロード先の URL にアクセスし、カメラでマーカーを写せば、モデルが表示されます。

## サーバーを用意せずにPCだけで試すには？（要ウェブカメラ）

1. Google Chrome に [Web Server for Chrome](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=ja) アドオンを追加します

2. Web Server for Chrome を実行し、CHOOSE FOLDER ボタンで CubismARjsSample のあるフォルダを選択します

3. ブラウザから [http://127.0.0.1:8887/vrm-three-ar-master/](http://127.0.0.1:8887/vrm-three-ar-master/) にアクセスします

4. カメラでマーカーを映すとモデルが表示されます

## オリジナルのモデルを使うには？

1. assets フォルダの vrmファイルを差し替えます

2. index.html をテキスト形式で開き、vrm ファイルへのパスを差し替えたものに変更します

　(assets/VRoid.vrm を上書きしただけであればパスの変更は不要です)

3. オリジナルのモデルが表示されるようになります

## オリジナルのマーカーを使うには？

1. [AR.js Marker Training](https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html) を開きます

2. UPLOAD ボタンを押し、マーカーにしたい画像を選択します

3. DOWNLOAD ボタンを押し、patt ファイルを assets フォルダに保存します

4. index.html をテキスト形式で開き、patt ファイルへのパスを差し替えたものに変更します

　(assets/marker.patt を上書きしただけであればパスの変更は不要です)

5. 画面中央に表示されている黒枠に囲まれた画像がマーカーとして使えるようになります

## オリジナルのQRコードを使うには？

QR コードの作成方法に指定はありません。

ウェブ上にQRコード生成サービスが多数提供されていますので、お好きなものをお使いください。

[artistic QR Code](https://github.com/sylnsfar/qrcode) などを使うとイラストを含んだQRコードが生成できます。

## 注意事項

- モーションは[こちら](http://examples.claygl.xyz/examples/basicModelAnimation.html)のデータをお借りしています

- マーカー（QR）に対して垂直に立たせる場合はindex.htmlのstandフラグをtrueにしてください

## ライセンス

AR.js は MIT License で提供されています。
[AR.js license](https://github.com/jeromeetienne/AR.js/blob/master/LICENSE.txt)

ARToolKit.js は LGPLv3 で提供されています。
[ARToolKit.js license](https://github.com/artoolkit/jsartoolkit5/blob/master/LICENSE.txt)

QRコードは(株)デンソーウェーブの登録商標です。


