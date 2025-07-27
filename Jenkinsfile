pipeline {
    agent { label 'Jenkins-Agent' }

    tools {
        jdk 'Java17'
        maven 'Maven3'
        nodejs 'Node22'
    }

    environment {
        MYSQL_DB = 'database'
        MYSQL_PORT = '3306'
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

        stage('Test Application') {
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
                    withSonarQubeEnv(credentialsId: 'jenkins-sonarqube-token') {
                        sh 'sonar-scanner'
                    }
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
    }

    post {
        always {
            echo 'Pipeline finished'
        }
    }
}
