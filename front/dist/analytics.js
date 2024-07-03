(function() {
    const config = {
        apiUrl: "<your-domain-name>", // API 地址
        page_pv_id: "page_pv", // PV 元素 ID
        page_uv_id: "page_uv", // UV 元素 ID
        init: async function() {
            try {
                const locationData = getLocation(window.location.href);
                const pvElement = document.getElementById(config.page_pv_id);
                const uvElement = document.getElementById(config.page_uv_id);

                // 发送数据
                const requestData = {
                    visitorUrl: locationData.pathname,
                    visitorHostName: locationData.hostname,
                    visitorReferrer: document.referrer,
                    pvEnable: !!pvElement, // 检查 PV 元素是否存在
                    uvEnable: !!uvElement  // 检查 UV 元素是否存在
                };

                const endpoint = `${config.apiUrl}/api/visit`;
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                });

                // 解析响应数据
                const data = await response.json();

                if (data.code !== 200) {
                    throw new Error(`Error: ${data.message}`);
                }

                // 更新 PV 和 UV 元素内容
                if (pvElement) {
                    pvElement.innerText = data.data.pagePv;
                }

                if (uvElement) {
                    uvElement.innerText = data.data.pageUv;
                }
            } catch (error) {
                console.error("Error: ", error);
            }
        }
    };

    // 获取 URL 位置数据
    const getLocation = function(url) {
        const anchor = document.createElement("a");
        anchor.href = url;
        return anchor;
    };

    // 初始化配置
    if (typeof window !== "undefined") {
        config.init();
        window.WebViso = config;
    }
})();
