package org.aione.monihub.agent.filter;

import lombok.Getter;

import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * HTTP禁用过滤器
 * 当HTTP被禁用时，拦截所有HTTP请求并返回403错误
 */
@Getter
public class HttpDisabledFilter implements Filter {

    /**
     * -- GETTER --
     * 检查HTTP是否被禁用
     *
     * @return true表示HTTP被禁用，false表示HTTP可用
     */
    // 是否禁用HTTP的标志位
    private volatile boolean httpDisabled = false;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (httpDisabled) {
            // 如果HTTP被禁用，返回403 Forbidden错误
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            httpResponse.setContentType("application/json;charset=UTF-8");
            httpResponse.getWriter().write("");
            return;
        }

        // 如果HTTP未被禁用，继续处理请求
        chain.doFilter(request, response);
    }

    /**
     * 启用HTTP访问
     */
    public void enableHttp() {
        this.httpDisabled = false;
    }

    /**
     * 禁用HTTP访问
     */
    public void disableHttp() {
        this.httpDisabled = true;
    }

}