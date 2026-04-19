import { Component } from "react";

export class SCErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null, info: null };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    this.setState({ info });
  }

  render() {
    if (this.state.err) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f6f8",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 560, padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>Error</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1117", marginBottom: 8 }}>
              SC Command Centre Runtime Error
            </div>
            <pre
              style={{
                fontSize: 12,
                color: "#666",
                background: "#fff",
                border: "1px solid #e2e4e8",
                borderRadius: 10,
                padding: 16,
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              {this.state.err?.message || String(this.state.err)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20,
                padding: "10px 24px",
                background: "#1558d6",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
