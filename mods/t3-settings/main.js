import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex, Switch, Button } from "gpui-base";
import { theme, layout, run, props, closeOverlay, shared, setShared } from "herdr";

function frame(node) {
  if (node?.id === "main" && node.content?.pane?.header?.content?.mod === "t3-pane") return node.content.pane;
  for (const child of node?.children ?? []) {
    const found = frame(child);
    if (found) return found;
  }
  return null;
}

export default class Settings extends View {
  render() {
    const t = theme(), pane = frame(layout());
    const on = Boolean(pane?.focus && pane.focus.color !== (pane.background ?? "background"));
    const toggle = Switch.new("focus-border").checked(on).disabled(!pane?.focus)
        .accessibility_label("Focus border")
        .w_full().h(76).px(16).flex().items_center().gap(24).rounded(8)
        .bg(t.background).border(1).border_color(t.border).text_color(t.foreground)
        .on_change((enabled, cx) => {
          const root = layout(), current = frame(root);
          if (!current?.focus) return;
          const color = enabled ? "accent" : current.background ?? "background";
          if (current.focus.color === color) return;
          current.focus = { ...current.focus, color };
          run("layout.set", { layout: root });
          cx.notify();
        })
        .child(v_flex().flex_1().min_w(0).gap(6)
          .child(div().font_medium().child("Focus border"))
          .child(div().text_size(12).text_color(t.muted).child("Highlight the active pane.")))
        .child(div().w(34).h(20).p(2).flex_none().rounded_full().bg(on ? t.accent : t.hover)
          .flex().when(on, el => el.justify_end())
          .child(div().size(16).rounded_full().bg(on ? t.accent_foreground : t.muted)));
    const auto = shared("t3.auto-release") === true;
    const release = Switch.new("auto-release").checked(auto)
      .accessibility_label("Auto release")
      .w_full().h(92).px(16).flex().items_center().gap(24).rounded(8)
      .bg(t.background).border(1).border_color(t.border).text_color(t.foreground)
      .on_change((enabled, cx) => {
        setShared("t3.auto-release", enabled === true);
        cx.notify();
      })
      .child(v_flex().flex_1().min_w(0).gap(6)
        .child(div().font_medium().child("Auto release (Pi only)"))
        .child(div().text_size(12).text_color(t.muted).child("Release idle Pi agents after 30 minutes in Settle.")))
      .child(div().w(34).h(20).p(2).flex_none().rounded_full().bg(auto ? t.accent : t.hover)
        .flex().when(auto, el => el.justify_end())
        .child(div().size(16).rounded_full().bg(auto ? t.accent_foreground : t.muted)));
    return v_flex().id("t3-settings-page").size_full().bg(t.popover).text_size(13).text_color(t.foreground)
      .child(h_flex().h(76).flex_none().px(24).items_center().border_b(1).border_color(t.border)
        .child(v_flex().flex_1().gap(4)
          .child(div().text_size(18).font_semibold().child("Herdr T3"))
          .child(div().text_size(12).text_color(t.muted).child("Settings")))
        .child(Button.new("close-settings").size(28).flex_none().flex().items_center().justify_center().rounded(6)
          .text_color(t.muted).hover(s => s.bg(t.hover).text_color(t.foreground))
          .accessibility_label("Close settings")
          .on_click(() => closeOverlay(props().overlay))
          .child(svg("mods/pane/close.svg").size(14))))
      .child(v_flex().flex_1().min_h(0).p(24).gap(12)
        .child(div().text_size(12).font_medium().text_color(t.muted).child("Appearance"))
        .child(toggle)
        .child(div().mt(8).text_size(12).font_medium().text_color(t.muted).child("Behavior"))
        .child(release))
      .child(h_flex().h(48).flex_none().px(24).items_center().border_t(1).border_color(t.border)
        .child(div().text_size(11).text_color(t.dim).child("Changes apply immediately.")));
  }
}
