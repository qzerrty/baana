import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Line, LineFactory, useLineContext, ReactLabel, Marker } from '..';
import { PointObj, uniqueMarkerId } from '../utils';
import { LabelInterface, LabelPropsType } from '../Label';
import { LinePropsType } from '../Line';
import { createPortal } from 'react-dom';
import { MarkerPropsType } from '../Marker';
import { LineFactoryProps } from '../LineFactory';

export type Render = (start: PointObj, end: PointObj) => void;

type ArrowProps = {
    start: React.RefObject<HTMLElement> | string;
    end: React.RefObject<HTMLElement> | string;

    scale?: LinePropsType['scale'];
    color?: LinePropsType['strokeColor'];
    className?: LinePropsType['className'];
    curviness?: LinePropsType['curviness'];
    strokeWidth?: LinePropsType['strokeWidth'];

    offsetStartX?: number;
    offsetStartY?: number;
    offsetEndX?: number;
    offsetEndY?: number;

    onHover?: LinePropsType['onHover'];
    onClick?: LinePropsType['onClick'];

    /**
     * MARKER PROPS
     */
    withHead?: LineFactoryProps['withMarker'];
    headSize?: MarkerPropsType['size'];
    headColor?: MarkerPropsType['fillColor'];
} & (
    | {
          /**
           * CUSTON LABEL
           */
          label?: JSX.Element;

          text?: never;
          labelClassName?: never;
      }
    | {
          /**
           * DEFAULT LABEL
           */
          text?: LabelPropsType['text'];
          labelClassName?: LabelPropsType['className'];

          label?: never;
      }
);

export const Arrow: React.FC<ArrowProps> = ({
    start,
    end,

    color,
    scale,
    curviness,
    className,
    strokeWidth,

    offsetStartX,
    offsetStartY,
    offsetEndX,
    offsetEndY,

    text,
    labelClassName,
    label: customLabel,

    withHead,
    headColor,
    headSize,

    onHover,
    onClick,
}) => {
    const { getContainerRef, getSVG, getConfig } = useLineContext();

    const chached = useRef<{
        line?: Line;
        marker?: Marker;
        label?: LabelInterface;
    }>({});

    const container = getContainerRef();
    const svg = getSVG();
    const config = getConfig();

    const offset = useMemo<LinePropsType['offset']>(
        () => ({
            start: [
                offsetStartX ?? config.offset?.start?.[0] ?? 0,
                offsetStartY ?? config.offset?.start?.[1] ?? 0,
            ],
            end: [
                offsetEndX ?? config.offset?.end?.[0] ?? 0,
                offsetEndY ?? config.offset?.end?.[1] ?? 0,
            ],
        }),
        [offsetStartX, offsetStartY, offsetEndX, offsetEndY, config.offset]
    );

    const customLabelController = customLabel && ReactLabel(customLabel);

    const withMarker =
        withHead ??
        config.withHead ??
        Boolean(headColor || headSize || config.headColor || config.headSize);

    const updateLine = useCallback(() => {
        const startElement =
            typeof start === 'string'
                ? document.getElementById(start)
                : start.current;
        const endElement =
            typeof end === 'string'
                ? document.getElementById(end)
                : end.current;

        if (chached.current.line && startElement && endElement) {
            chached.current.line.update(startElement, endElement);
        }
    }, [start, end]);

    const clearHTMLNodes = () => {
        chached.current.line?.remove();
        chached.current.label?.remove?.();
        chached.current.marker?.remove();
    };

    /**
     * RECREATE IF CONTAINER CHANGES
     */
    useEffect(() => {
        const arrow = chached.current.line;

        if (container && svg && arrow?.svg !== svg.svg) {
            arrow?.remove();

            const {
                line,
                label: simpleLabel,
                marker,
            } = LineFactory({
                svg,

                scale: scale ?? config.scale,
                offset,
                strokeColor: color ?? config.color,
                curviness: curviness ?? config.curviness,
                className: className ?? config.arrowClassName,
                strokeWidth: strokeWidth ?? config.strokeWidth,

                withMarker,
                markerColor: headColor ?? config.headColor,
                markerSize: headSize ?? config.headSize,

                onHover,
                onClick,

                ...(customLabelController?.controller
                    ? {
                          customLabel: customLabelController?.controller,
                      }
                    : {
                          labelText: text,
                          labelClassName:
                              labelClassName ?? config.labelClassName,
                      }),
            });

            chached.current = {
                line,
                marker,
                label: simpleLabel,
            };

            updateLine();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container?.current]);

    /**
     * REMOVE HTML NODES ON UNMOUNT
     */
    useEffect(() => {
        return clearHTMLNodes;
    }, []);

    /**
     * RECONFIG HTML NODES ON PROPS CHANGES
     */
    useEffect(() => {
        if (!withMarker) {
            chached.current.marker?.remove();
            chached.current.marker = undefined;
        } else if (!chached.current.marker && svg?.svg) {
            chached.current.marker = new Marker({
                svg: svg?.svg,
                id: uniqueMarkerId(),
                size: headSize ?? config.headSize,
                fillColor:
                    headColor ?? config.headColor ?? color ?? config.color,
            });
        }

        if (chached.current.line) {
            chached.current.line.reconfig({
                offset,
                scale: scale ?? config.scale,
                strokeColor: color ?? config.color,
                strokeWidth: strokeWidth ?? config.strokeWidth,
                curviness: curviness ?? config.curviness,
                className: className ?? config.arrowClassName,
                marker: chached.current.marker,
                onHover,
                onClick,
            });
        }
        if (chached.current.label) {
            chached.current.label?.configClassName?.(
                labelClassName ?? config.labelClassName
            );
        }
        if (chached.current.marker) {
            chached.current.marker.setSize(headSize ?? config.headSize);
            chached.current.marker.setFillColor(
                headColor ?? config.headColor ?? color ?? config.color
            );
        }

        updateLine();
    }, [
        config,
        offset,
        color,
        scale,
        curviness,
        className,
        withHead,
        headColor,
        headSize,
        labelClassName,
        onHover,
        onClick,
        withMarker,
        svg?.svg,
        updateLine,
        strokeWidth,
    ]);

    useEffect(() => {
        if (chached.current.label && text) {
            chached.current.label.setText?.(text);
        }
    }, [text]);

    /**
     * RERENDER IF START/END CHANGES
     */
    useEffect(() => {
        updateLine();
    }, [updateLine, start, end]);

    updateLine();

    return container?.current && customLabelController?.render
        ? createPortal(customLabelController?.render(), container?.current)
        : null;
};
