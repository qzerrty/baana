import React, {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { SVGContainer } from '../SVG';
import { LinePropsType } from '../Line';
import { LabelPropsType } from '../Label';
import { LineFactoryProps } from '../LineFactory';
import { TargetPointer } from './Arrow';

export type ConfigType = {
    color?: LinePropsType['strokeColor'];
    arrowClassName?: LinePropsType['className'];

    useRegister?: boolean;

    withHead?: LineFactoryProps['withMarker'];
    headColor?: LineFactoryProps['markerColor'];
    headSize?: LineFactoryProps['markerSize'];

    labelClassName?: LabelPropsType['className'];
} & Pick<
    LinePropsType,
    'scale' | 'offset' | 'curviness' | 'strokeWidth' | 'onlyIntegerCoords'
>;

export type OffsetXY = {
    offsetStartX?: number;
    offsetStartY?: number;
    offsetEndX?: number;
    offsetEndY?: number;
};

export type LineContextType = {
    update(target?: HTMLElement): void;

    _registerTarget(target: TargetPointer, handler: () => void): void;
    _removeTarget(target: TargetPointer, handler: () => void): void;

    _getContainerRef(): React.RefObject<HTMLElement> | null;
    _getSVG(): SVGContainer | null;
    _getConfig(): ConfigType;

    _unstableState?: unknown;
};

const defaultValue = {
    update: () => {},
    _registerTarget: () => {},
    _removeTarget: () => {},
    _getContainerRef: () => null,
    _getSVG: () => null,
    _getConfig: () => ({}),
};

export const LineContext = createContext<LineContextType>(defaultValue);

type LineContextProviderType = {
    children: ReactNode;
} & OffsetXY &
    Record<string, unknown>;

export const LineContextProvider: React.FC<
    LineContextProviderType & Omit<ConfigType, 'offset'>
> = ({
    children,

    color,
    scale,
    curviness,
    arrowClassName,
    strokeWidth,

    onlyIntegerCoords,
    useRegister,

    offsetStartX,
    offsetStartY,
    offsetEndX,
    offsetEndY,

    withHead,
    headColor,
    headSize,

    labelClassName,

    ...others
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const [svg, setSVG] = useState<SVGContainer | null>(null);

    const offset = useMemo<LinePropsType['offset']>(
        () => ({
            start: [offsetStartX ?? 0, offsetStartY ?? 0],
            end: [offsetEndX ?? 0, offsetEndY ?? 0],
        }),
        [offsetStartX, offsetStartY, offsetEndX, offsetEndY]
    );

    const [_unstableState, updateState] = useState<unknown>();
    const forceUpdate = useCallback(() => updateState({}), []);

    const targetsWeakMap = useRef(new WeakMap<HTMLElement, Set<() => void>>());

    const _registerTarget: LineContextType['_registerTarget'] = useCallback(
        (target, handler) => {
            const targetElement =
                typeof target === 'string'
                    ? document.getElementById(target)
                    : target.current;

            if (targetElement) {
                if (!targetsWeakMap.current.has(targetElement)) {
                    targetsWeakMap.current.set(targetElement, new Set());
                }
                targetsWeakMap.current.get(targetElement)?.add(handler);
            }
        },
        []
    );

    const _removeTarget: LineContextType['_removeTarget'] = useCallback(
        (target, handler) => {
            const targetElement =
                typeof target === 'string'
                    ? document.getElementById(target)
                    : target.current;

            if (targetElement) {
                targetsWeakMap.current.get(targetElement)?.delete(handler);
            }
        },
        []
    );

    const update: LineContextType['update'] = (target) => {
        if (target && targetsWeakMap.current.get(target)) {
            targetsWeakMap.current.get(target)?.forEach((handler) => handler());
        } else {
            forceUpdate();
        }
    };

    useEffect(() => {
        if (containerRef.current && svg?.container !== containerRef.current) {
            svg?.container.removeChild(svg?.svg);
            setSVG(new SVGContainer({ container: containerRef.current }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerRef.current]);

    const config = useMemo(
        () => ({
            color,
            scale,
            offset,
            withHead,
            headSize,
            headColor,
            curviness,
            strokeWidth,
            arrowClassName,
            labelClassName,
            onlyIntegerCoords,
            useRegister,
        }),
        [
            color,
            scale,
            offset,
            withHead,
            headSize,
            headColor,
            curviness,
            strokeWidth,
            arrowClassName,
            labelClassName,
            onlyIntegerCoords,
            useRegister,
        ]
    );

    const _getContainerRef = () => containerRef;
    const _getSVG = () => svg;
    const _getConfig = () => config;

    return (
        <LineContext.Provider
            value={{
                update,
                _registerTarget,
                _removeTarget,
                _getContainerRef,
                _getConfig,
                _getSVG,
                _unstableState,
            }}
        >
            <div ref={containerRef} {...others}>
                {children}
            </div>
        </LineContext.Provider>
    );
};

export const useLineContext = () => useContext(LineContext);
