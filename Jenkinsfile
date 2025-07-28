pipeline {
    agent { label 'Jenkins-Agent' }

    tools {
        jdk 'Java17'
        maven 'Maven3'
        nodejs 'Node22'
    }

    environment {
        MYSQL_DB     = 'database'
        MYSQL_PORT   = '3306'
        APP_NAME     = "portfolio-app-pipeline"
        RELEASE      = "1.0.0"
        DOCKER_USER  = "elyeshub"
        DOCKER_PASS  = 'dockerhub'
        IMAGE_NAME   = "${DOCKER_USER}/${APP_NAME}"
        IMAGE_TAG    = "${RELEASE}-${BUILD_NUMBER}"
        JENKINS_API_TOKEN = credentials("JENKINS_API_TOKEN")
    }

    stages {
        stage('Start MySQL (no password)') {
            steps {
                sh '''
                    docker run --name mysql-test \
                        -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
                        -e MYSQL_DATABASE=$MYSQL_DB \
                        -p $MYSQL_PORT:3306 \
                        -d mysql:8.0 \
                        --default-authentication-plugin=mysql_native_password

                    echo "Waiting for MySQL to start..."
                    sleep 20
                '''
            }
        }

        stage('Cleanup Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout from SCM') {
            steps {
                git branch: 'main', credentialsId: 'github', url: 'https://github.com/elyes2dev/pipeline-cicd'
            }
        }

        stage('Build Application') {
            steps {
                script {
                    // Build Angular frontend
                    dir('frontend') {
                        sh 'npm install'
                        sh 'npm run build --prod'
                    }

                    // Build Spring Boot backend
                    dir('backend') {
                        sh 'mvn clean package -DskipTests'
                    }
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'mvn test'
                }
            }
        }

        stage('SonarQube Analysis Backend') {
            steps {
                dir('backend') {
                    script {
                        withSonarQubeEnv(credentialsId: 'jenkins-sonarqube-token') {
                            sh 'mvn sonar:sonar'
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis Frontend') {
            steps {
                dir('frontend') {
                    script {
                        withSonarQubeEnv(credentialsId: 'jenkins-sonarqube-token') {
                            sh 'npm install --global sonar-scanner'
                            sh 'npx sonar-scanner'
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    waitForQualityGate abortPipeline: false, credentialsId: 'jenkins-sonarqube-token'
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                script {
                    // Build and push backend image
                    docker.withRegistry('', DOCKER_PASS) {
                        def backendImage = docker.build("${IMAGE_NAME}-backend:${IMAGE_TAG}", 'backend/')
                        backendImage.push()
                        backendImage.push('latest')
                    }

                    // Build and push frontend image
                    docker.withRegistry('', DOCKER_PASS) {
                        def frontendImage = docker.build("${IMAGE_NAME}-frontend:${IMAGE_TAG}", 'frontend/')
                        frontendImage.push()
                        frontendImage.push('latest')
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                script {
                    sh 'docker run -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image elyeshub/portfolio-app-pipeline-frontend:latest --no-progress --scanners vuln --exit-code 0 --severity HIGH,CRITICAL --format table'
                    sh 'docker run -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image elyeshub/portfolio-app-pipeline-backend:latest --no-progress --scanners vuln --exit-code 0 --severity HIGH,CRITICAL --format table'
                }
            }
        }

        stage('Stop MySQL') {
            steps {
                sh '''
                    docker stop mysql-test || true
                    docker rm mysql-test || true
                '''
            }
        }

        stage('Cleanup Artifacts') {
            steps {
                script {
                    sh "docker rmi ${IMAGE_NAME}-backend:${IMAGE_TAG} || true"
                    sh "docker rmi ${IMAGE_NAME}-backend:latest || true"
                    sh "docker rmi ${IMAGE_NAME}-frontend:${IMAGE_TAG} || true"
                    sh "docker rmi ${IMAGE_NAME}-frontend:latest || true"
                }
            }
        }

        stage('Trigger CD Pipeline') {
            steps {
                script {
                    sh "curl -v -k --user elyesaws:${JENKINS_API_TOKEN} -X POST -H 'cache-control: no-cache' -H 'content-type: application/x-www-form-urlencoded' --data 'IMAGE_TAG=${IMAGE_TAG}' 'ec2-52-47-111-164.eu-west-3.compute.amazonaws.com:8080/job/gitops-pipeline-cd/buildWithParameters?token=argocd-token'"
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished'
        }
    }
}
