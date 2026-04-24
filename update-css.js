const fs = require('fs');
let css = fs.readFileSync('admin/admin.css', 'utf8');

css = css.replace(/body\s*\{[\s\S]*?min-height:\s*100vh;\s*\}/, 'body {\n    background: #09090b;\n    color: #f4f4f5;\n    font-family: \'Inter\', sans-serif;\n    font-size: 14px;\n    min-height: 100vh;\n}');

css = css.replace(/\.adm-topbar\s*\{[\s\S]*?flex-shrink:\s*0;\s*\}/, '.adm-topbar {\n    height: 54px;\n    background: rgba(9, 9, 11, 0.8);\n    border-bottom: 1px solid #27272a;\n    display: flex;\n    align-items: center;\n    padding: 0 20px;\n    gap: 16px;\n    position: sticky;\n    top: 0;\n    z-index: 100;\n    flex-shrink: 0;\n    backdrop-filter: blur(12px);\n}');

css = css.replace(/\.adm-sidebar\s*\{[\s\S]*?overflow-y:\s*auto;\s*\}/, '.adm-sidebar {\n    width: 200px;\n    background: #09090b;\n    border-right: 1px solid #27272a;\n    flex-shrink: 0;\n    padding: 16px 10px;\n    position: sticky;\n    top: 54px;\n    height: calc(100vh - 54px);\n    overflow-y: auto;\n}');

css = css.replace(/\.adm-nav-btn\s*\{[\s\S]*?margin-bottom:\s*2px;\s*\}/, '.adm-nav-btn {\n    display: flex;\n    align-items: center;\n    gap: 9px;\n    width: 100%;\n    padding: 10px 14px;\n    background: transparent;\n    border: none;\n    border-radius: 8px;\n    color: #a1a1aa;\n    font-family: \'Inter\', sans-serif;\n    font-size: 13px;\n    font-weight: 500;\n    cursor: pointer;\n    text-align: left;\n    transition: all 0.2s ease;\n    margin-bottom: 4px;\n}');
css = css.replace(/\.adm-nav-btn:hover\s*\{[^\}]*\}/, '.adm-nav-btn:hover { background: #18181b; color: #f4f4f5; }');
css = css.replace(/\.adm-nav-btn\.active\s*\{[^\}]*\}/, '.adm-nav-btn.active { background: #6366f1; color: #ffffff; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25); }');

css = css.replace(/\.adm-page-title\s*\{[\s\S]*?margin-bottom:\s*4px;\s*\}/, '.adm-page-title {\n    font-size: 24px;\n    font-weight: 600;\n    letter-spacing: -0.5px;\n    color: #fafafa;\n    margin-bottom: 6px;\n}');
css = css.replace(/\.adm-page-sub\s*\{[\s\S]*?margin-bottom:\s*24px;\s*\}/, '.adm-page-sub {\n    font-size: 14px;\n    color: #a1a1aa;\n    margin-bottom: 28px;\n}');

css = css.replace(/\.adm-search\s*\{[\s\S]*?transition:\s*border-color\s*0\.2s;\s*\}/, '.adm-search {\n    flex: 1;\n    min-width: 200px;\n    padding: 10px 14px;\n    background: #18181b;\n    border: 1px solid #27272a;\n    border-radius: 8px;\n    color: #f4f4f5;\n    font-family: \'Inter\', sans-serif;\n    font-size: 13px;\n    outline: none;\n    transition: all 0.2s ease;\n    box-shadow: 0 1px 2px rgba(0,0,0,0.05);\n}');
css = css.replace(/\.adm-search:focus\s*\{[^\}]*\}/, '.adm-search:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }');

css = css.replace(/\.adm-btn\s*\{[\s\S]*?white-space:\s*nowrap;\s*\}/, '.adm-btn {\n    padding: 10px 20px;\n    background: #6366f1;\n    border: none;\n    border-radius: 8px;\n    color: #fff;\n    font-family: \'Inter\', sans-serif;\n    font-size: 13px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: all 0.2s ease;\n    white-space: nowrap;\n    box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);\n}');
css = css.replace(/\.adm-btn:hover\s*\{[^\}]*\}/, '.adm-btn:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }');

css = css.replace(/\.adm-form-panel\s*\{[\s\S]*?margin-bottom:\s*20px;\s*\}/, '.adm-form-panel {\n    display: none;\n    background: #0f0f12;\n    border: 1px solid #27272a;\n    border-radius: 12px;\n    padding: 24px;\n    margin-bottom: 24px;\n    box-shadow: 0 4px 20px rgba(0,0,0,0.15);\n}');

css = css.replace(/\.adm-label\s*\{[\s\S]*?color:\s*rgba\(255,255,255,0\.35\);\s*\}/, '.adm-label {\n    font-size: 12px;\n    font-weight: 500;\n    color: #a1a1aa;\n}');

css = css.replace(/\.adm-input,\s*\.adm-textarea,\s*\.adm-select\s*\{[\s\S]*?transition:\s*border-color\s*0\.2s;\s*\}/, '.adm-input, .adm-textarea, .adm-select {\n    padding: 10px 14px;\n    background: #18181b;\n    border: 1px solid #27272a;\n    border-radius: 8px;\n    color: #f4f4f5;\n    font-family: \'Inter\', sans-serif;\n    font-size: 14px;\n    outline: none;\n    transition: all 0.2s ease;\n    box-shadow: 0 1px 2px rgba(0,0,0,0.05);\n}');

css = css.replace(/\.adm-input:focus,\s*\.adm-textarea:focus,\s*\.adm-select:focus\s*\{[^\}]*\}/, '.adm-input:focus, .adm-textarea:focus, .adm-select:focus {\n    border-color: #6366f1;\n    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);\n}');

css = css.replace(/\.adm-select\s*\{\s*cursor:\s*pointer;\s*\}/, '.adm-select { \n    cursor: pointer; \n    appearance: none;\n    background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E");\n    background-repeat: no-repeat;\n    background-position: right 14px center;\n    background-size: 16px;\n    padding-right: 40px;\n}\n.adm-select option {\n    background: #18181b;\n    color: #f4f4f5;\n}');

css = css.replace(/\.adm-toggle-wrap\s*\{[\s\S]*?font-size:\s*13px;\s*\}/, '.adm-toggle-wrap {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    color: #e4e4e7;\n    font-size: 14px;\n    font-weight: 500;\n}');

css = css.replace(/\.adm-toggle\s*\{[\s\S]*?flex-shrink:\s*0;\s*\}/, '.adm-toggle {\n    width: 44px;\n    height: 24px;\n    appearance: none;\n    background: #3f3f46;\n    border-radius: 24px;\n    position: relative;\n    cursor: pointer;\n    transition: background 0.3s ease;\n    flex-shrink: 0;\n    outline: none;\n}');

css = css.replace(/\.adm-toggle::after\s*\{[\s\S]*?transition:\s*left\s*0\.2s;\s*\}/, '.adm-toggle::after {\n    content: \'\';\n    position: absolute;\n    top: 3px;\n    left: 3px;\n    width: 18px;\n    height: 18px;\n    background: #fff;\n    border-radius: 50%;\n    transition: left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);\n    box-shadow: 0 2px 4px rgba(0,0,0,0.2);\n}');

css = css.replace(/\.adm-toggle:checked::after\s*\{[^\}]*\}/, '.adm-toggle:checked::after { left: 23px; }');

css = css.replace(/\.adm-table\s*th\s*\{[\s\S]*?white-space:\s*nowrap;\s*\}/, '.adm-table th {\n    padding: 12px 14px;\n    text-align: left;\n    font-size: 12px;\n    font-weight: 500;\n    color: #a1a1aa;\n    background: #0f0f12;\n    border-bottom: 1px solid #27272a;\n    white-space: nowrap;\n}');

css = css.replace(/\.adm-table\s*td\s*\{[\s\S]*?vertical-align:\s*middle;\s*\}/, '.adm-table td {\n    padding: 12px 14px;\n    border-bottom: 1px solid #27272a;\n    color: #e4e4e7;\n    vertical-align: middle;\n}');

fs.writeFileSync('admin/admin.css', css);
console.log('CSS Replaced Successfully');
