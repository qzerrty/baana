export type LabelInterface = {
    setPos(x: number, y: number): void;
    remove?(): void;
    setText?(text: string): void;
    configClassName?(className?: string): void;
};

export type LabelPropsType = {
    container: HTMLElement;
    text: string;
    className?: string;
};

export class Label {
    label: HTMLElement;
    container: HTMLElement;

    constructor({ container, text, className }: LabelPropsType) {
        this.label = document.createElement('div');
        this.label.classList.add('baana__line-label');
        if (className) {
            this.label.classList.add(className);
        }
        this.label.innerHTML = text;

        this.container = container;
        this.container.appendChild(this.label);
    }

    setPos(x: number, y: number) {
        this.label.style['top'] = `${y}px`;
        this.label.style['left'] = `${x}px`;
    }

    remove() {
        this.container.removeChild(this.label);
    }

    setText(text: string) {
        this.label.innerHTML = text;
    }

    configClassName(className?: string) {
        this.label.classList.remove(...this.label.classList);
        this.label.classList.add('baana__line-label');
        if (className) {
            this.label.classList.add(className);
        }
    }
}
