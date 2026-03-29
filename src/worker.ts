import { env, AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';

// モデルのダウンロードなどにHugging FaceのCDNを使用
env.allowLocalModels = false;
env.useBrowserCache = true;

let model: any = null;
let processor: any = null;

self.addEventListener('message', async (event) => {
  const { id, imageUrl } = event.data;
  
  try {
    if (!model) {
      self.postMessage({ id, type: 'status', status: 'loading', message: 'AIモデルを準備中...(初回のみ数MBダウンロードします)' });

      // モデルのロード
      model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
        config: { model_type: 'custom' },
        progress_callback: (info: any) => {
          self.postMessage({ id, type: 'progress', data: info });
        }
      });

      // プロセッサのロード
      processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          feature_extractor_type: 'ImageFeatureExtractor',
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 }
        }
      });
    }

    self.postMessage({ id, type: 'status', status: 'processing', message: '背景を透過中...' });

    // 画像の読み込みと推論
    const image = await RawImage.fromURL(imageUrl);
    const { pixel_values } = await processor(image);
    const { output } = await model({ input: pixel_values });

    // バウンディングボックス等の制限がないシンプルなモデル出力なので、結果をアルファマスクとして処理
    const outputTensor = output[0] ? output[0] : output;
    const mask = await RawImage.fromTensor(outputTensor.mul(255).to('uint8')).resize(image.width, image.height);

    // キャンバスを作成して合成
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('キャンバスコンテキストが取得できません。');
    
    // 元画像のデータをRGBAに変換してアルファチャンネルをマスクから適用
    const resultImage = image.clone();
    
    // RGB -> RGBA
    if (resultImage.channels === 3) {
      const newData = new Uint8ClampedArray(resultImage.width * resultImage.height * 4);
      for (let i = 0, j = 0; i < resultImage.data.length; i += 3, j += 4) {
        newData[j] = resultImage.data[i];
        newData[j + 1] = resultImage.data[i + 1];
        newData[j + 2] = resultImage.data[i + 2];
        newData[j + 3] = mask.data[i / 3]; // マスクをアルファ値として適用
      }
      resultImage.data = newData;
      resultImage.channels = 4;
    } else if (resultImage.channels === 4) {
      for (let i = 0; i < resultImage.data.length; i += 4) {
        resultImage.data[i + 3] = mask.data[i / 4];
      }
    }

    const imgData = new ImageData(new Uint8ClampedArray(resultImage.data), resultImage.width, resultImage.height);
    ctx.putImageData(imgData, 0, 0);
    
    // Blobに変換してメインスレッドに渡す
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const url = URL.createObjectURL(blob);

    self.postMessage({ id, type: 'complete', url });
    
  } catch (error: any) {
    console.error('Worker error:', error);
    self.postMessage({ id, type: 'error', error: error.message || '不明なエラーが発生しました' });
  }
});
