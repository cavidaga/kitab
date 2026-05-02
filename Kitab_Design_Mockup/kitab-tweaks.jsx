// Kitab Tweaks Panel
// Loaded after tweaks-panel.jsx and kitab-app.jsx

// This file wires up the Tweaks panel to the Kitab redesign page.
// Since kitab-app.jsx already renders the full App via ReactDOM.createRoot,
// we just need to mount the tweaks panel separately and communicate
// via custom events or a shared store.

// We'll use a simple approach: mount a floating tweaks panel that
// dispatches custom events the App listens to.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#e6a43a",
  "borderRadius": 8,
  "fontScale": 1,
  "showVariantA": true,
  "showVariantB": true,
  "showVariantC": true
}/*EDITMODE-END*/;

function KitabTweaksPanel() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('kitab-tweaks', { detail: tweaks }));
  }, [tweaks]);

  return (
    <TweaksPanel>
      <TweakSection label="Accent Color">
        <TweakColor label="Color" value={tweaks.accentColor} onChange={v => setTweak('accentColor', v)} />
      </TweakSection>
      <TweakSection label="Layout">
        <TweakToggle label="Show Variant A" value={tweaks.showVariantA} onChange={v => setTweak('showVariantA', v)} />
        <TweakToggle label="Show Variant B" value={tweaks.showVariantB} onChange={v => setTweak('showVariantB', v)} />
        <TweakToggle label="Show Variant C" value={tweaks.showVariantC} onChange={v => setTweak('showVariantC', v)} />
      </TweakSection>
      <TweakSection label="Typography">
        <TweakSlider label="Font Scale" value={tweaks.fontScale} min={0.85} max={1.2} step={0.05} onChange={v => setTweak('fontScale', v)} />
      </TweakSection>
      <TweakSection label="Shape">
        <TweakSlider label="Border Radius" value={tweaks.borderRadius} min={0} max={20} step={1} onChange={v => setTweak('borderRadius', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

const tweaksRoot = document.createElement('div');
tweaksRoot.id = 'tweaks-root';
document.body.appendChild(tweaksRoot);
ReactDOM.createRoot(tweaksRoot).render(<KitabTweaksPanel />);
