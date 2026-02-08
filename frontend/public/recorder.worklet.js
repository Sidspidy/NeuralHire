class RecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 2048;
        this._bytesWritten = 0;
        this._buffer = new Float32Array(this.bufferSize);
        this.init = false;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        // If no input, just return
        if (!input || input.length === 0) return true;

        const inputChannel = input[0];

        // Post data to main thread
        // We send raw floats, main thread can convert (simpler for now than implementing resampling here without knowing input sample rate strictly)
        // Actually current sample rate is global currentSampleRate or sampleRate?
        // "sampleRate" is global in AudioWorkletGlobalScope.

        // We'll just buffer and send.
        this.port.postMessage(inputChannel);

        return true;
    }
}

registerProcessor('recorder-processor', RecorderProcessor);
