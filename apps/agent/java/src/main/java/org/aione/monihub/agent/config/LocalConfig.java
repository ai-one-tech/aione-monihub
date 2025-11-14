package org.aione.monihub.agent.config;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;

@Data
@Accessors(chain = true)
public class LocalConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    private String instanceId;

}
