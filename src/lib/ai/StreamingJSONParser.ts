import { EventEmitter } from "node:events";

enum ParserState {
	WaitingForKey = 0,
	InKey = 1,
	WaitingForColon = 2,
	WaitingForValue = 3,
	InStringValue = 4,
	InNumberValue = 5,
	InBooleanValue = 6,
	InNullValue = 7,
	InArrayValue = 8,
}

export default class StreamingJSONParser extends EventEmitter {
	private accumulatedJson = "";
	private partialObject: Record<string, any> = {};
	private currentKey = "";
	private currentValue: any = "";
	private state = ParserState.WaitingForKey;
	private escapeNext = false;
	private stack: Array<Record<string, any> | any[]> = [];
	private arrayDepth = 0;

	constructor(prefill = "") {
		super();
		this.accumulatedJson = prefill;
		this.initializePrefill();
	}

	private initializePrefill() {
		const colonIndex = this.accumulatedJson.indexOf(":");
		if (colonIndex !== -1) {
			this.currentKey = this.accumulatedJson.slice(2, colonIndex - 1);
			this.state = ParserState.WaitingForValue;
		}
	}

	public processChunk(chunk: string): void {
		for (const char of chunk) {
			this.accumulatedJson += char;
			this.processChar(char);
		}
	}

	private processChar(char: string): void {
		if (this.escapeNext) {
			this.handleEscapeSequence(char);
			return;
		}

		switch (this.state) {
			case ParserState.WaitingForKey:
				if (char === '"') {
					this.state = ParserState.InKey;
					this.currentKey = "";
				} else if (char === "}") {
					this.finalizeObject();
				}
				break;
			case ParserState.InKey:
				if (char === '"') {
					this.state = ParserState.WaitingForColon;
				} else {
					this.currentKey += char;
				}
				break;
			case ParserState.WaitingForColon:
				if (char === ":") {
					this.state = ParserState.WaitingForValue;
				}
				break;
			case ParserState.WaitingForValue:
				if (char === '"') {
					this.state = ParserState.InStringValue;
					this.currentValue = "";
				} else if (char === "t" || char === "f") {
					this.state = ParserState.InBooleanValue;
					this.currentValue = char;
				} else if (char === "n") {
					this.state = ParserState.InNullValue;
					this.currentValue = char;
				} else if (char === "-" || (char >= "0" && char <= "9")) {
					this.state = ParserState.InNumberValue;
					this.currentValue = char;
				} else if (char === "[") {
					this.state = ParserState.InArrayValue;
					this.arrayDepth = 1;
					this.currentValue = char;
				} else if (char === "{") {
					this.stack.push(this.partialObject);
					this.partialObject = {};
					this.state = ParserState.WaitingForKey;
				}
				break;
			case ParserState.InStringValue:
				if (char === "\\") {
					this.escapeNext = true;
				} else if (char === '"' && !this.escapeNext) {
					this.finalizeKeyValuePair();
				} else {
					this.currentValue += char;
					this.escapeNext = false;
				}
				break;
			case ParserState.InNumberValue:
			case ParserState.InBooleanValue:
			case ParserState.InNullValue:
				if (char === "," || char === "}" || char === "]") {
					this.finalizeKeyValuePair();
					this.processChar(char);
				} else {
					this.currentValue += char;
				}
				break;
			case ParserState.InArrayValue:
				this.currentValue += char;
				if (char === "[") {
					this.arrayDepth++;
				} else if (char === "]") {
					this.arrayDepth--;
					if (this.arrayDepth === 0) {
						this.finalizeKeyValuePair();
					}
				}
				break;
		}
	}

	private handleEscapeSequence(char: string): void {
		switch (char) {
			case '"':
			case "\\":
			case "/":
				this.currentValue += char;
				break;
			case "b":
				this.currentValue += "\b";
				break;
			case "f":
				this.currentValue += "\f";
				break;
			case "n":
				this.currentValue += "\n";
				break;
			case "r":
				this.currentValue += "\r";
				break;
			case "t":
				this.currentValue += "\t";
				break;
			case "u":
				this.unicodeBuffer = "";
				return;
			default:
				throw new Error(`Invalid escape sequence: \\${char}`);
		}
		this.escapeNext = false;
	}

	private finalizeKeyValuePair(): void {
		let value: any;
		switch (this.state) {
			case ParserState.InStringValue:
				value = this.currentValue;
				break;
			case ParserState.InNumberValue:
				value = Number.parseFloat(this.currentValue);
				break;
			case ParserState.InBooleanValue:
				value = this.currentValue === "true";
				break;
			case ParserState.InNullValue:
				value = null;
				break;
			case ParserState.InArrayValue:
				value = JSON.parse(this.currentValue);
				break;
			default:
				throw new Error(
					`Unexpected state when finalizing key-value pair: ${this.state}`,
				);
		}

		if (this.stack.length && Array.isArray(this.stack[this.stack.length - 1])) {
			(this.stack[this.stack.length - 1] as any[]).push(value);
		} else {
			this.partialObject[this.currentKey] = value;
			this.emit("keyValuePair", { [this.currentKey]: value });
		}

		this.currentKey = "";
		this.currentValue = "";
		this.state = ParserState.WaitingForKey;
	}

	private finalizeObject(): void {
		if (this.stack.length) {
			const parent = this.stack.pop();
			if (Array.isArray(parent)) {
				parent.push(this.partialObject);
			} else {
				parent[this.currentKey] = this.partialObject;
			}
			this.partialObject = parent as Record<string, any>;
		}
		this.state = ParserState.WaitingForKey;
	}

	private finalizeArray(): void {
		const array = this.stack.pop() as any[];
		if (this.stack.length) {
			const parent = this.stack[this.stack.length - 1];
			if (Array.isArray(parent)) {
				parent.push(array);
			} else {
				parent[this.currentKey] = array;
			}
		} else {
			this.partialObject[this.currentKey] = array;
		}
		this.state = ParserState.WaitingForKey;
	}

	public getPartialObject(): Record<string, any> {
		return this.partialObject;
	}

	public getAccumulatedJson(): string {
		return this.accumulatedJson;
	}

	public getFinalObject(): Record<string, any> {
		return this.partialObject;
	}
}
